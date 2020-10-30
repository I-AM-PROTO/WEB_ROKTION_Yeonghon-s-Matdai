import express, { Request, Response, NextFunction } from "express";
import { UserModel, Tag } from "../schemas/user";
import crypto from 'crypto';
import { DocInfoModel, DocStatus } from "../schemas/docInfo";

const router = express.Router();

// 로그오프
router.get('/logoff', (req: Request, res: Response) => {
    //console.log(req.session);
    checkLogined(req.session!)
    .then(() => {
        req.session?.destroy(err => {
            if (err) {
                // 로그오프 실패
                console.error(err);
                throw err;
            } else {
                // 정상 로그오프
                res.status(200).end();
            }
        })
    })
    .catch(e => {
        res.status(500).end();
    });
})

// id=tagId인 유저 정보 찾기
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    checkLogined(req.session!)
    .then(() => {
        return getTagId(req.params.id);
    })
    .then(n => {
        return UserModel.findOne({ tagId: n }, {_id: 0, passwd: 0, passwdSalt: 0});
    })
    .then((user) => {
        //console.log(user!);
        res.json(user!);
    })
    .catch(err => {
        console.error(err);
        res.status(400).end();
    })    
});

// 로그인
// in: 아이디(=군번, id), 비밀번호(pw)
router.post('/login', (req: Request, res: Response) => {
    // 아이디가 존재하는지 확인
    getTagId(req.body.id)
    .then(id => {
        return UserModel.findOne({ tagId: id })
    })
    .then(usr => {
        if (usr !== null) {
            // 비밀번호를 암호화해 서버의 값과 비교
            crypto.pbkdf2(req.body.pw, usr.passwdSalt, 1231, 64, 'sha512', (err, key) => {
                if (key.toString('base64') === usr.passwd) {
                    // 맞으면 세션 생성, _id와 tagId를 저장해둔다.
                    req.session!.dbId = usr._id;
                    req.session!.tagId = usr.tagId;
                    //console.log(req.session);
                    req.session?.save(err => {
                        if (err) {
                            throw new Error(err);
                        }
                    });
                    console.log(usr.tagId, usr._id);
                    usr.recentLogin = new Date();
                    return usr.save();
                } else {
                    throw new Error(`Wrong password for ${usr.tagId}`);
                }
            })
        } else {
            throw new Error(`No user id with ${req.body.id}`);
        }
    })
    .then(() => {
        res.status(200).end();
    })
    .catch(e => {
        console.error(e);
        res.status(400).send(e);
    })
});

// 새로운 유저 생성
// in: name, regiment, tagId, passwd
router.post('/', (req: Request, res: Response, next: NextFunction) => {
    //console.log(req.body);
    getTagId(req.body.tagId, true)
    .then(tagId => {
        return new Promise<any>((res, rej) => {
            crypto.randomBytes(64, (err, buf) => {
                if (err) rej(err);
                let passwdSalt = buf.toString('base64');
                res({tagId, passwdSalt});
            })
        })
    })
    .then(data => {
        return new Promise<any>((res, rej) => {
            crypto.pbkdf2(req.body.passwd, data.passwdSalt.toString('base64'), 1231, 64, 'sha512', (err, key) => {
                if (err) rej(err);
                let passwd = key.toString('base64');
                res({...data, passwd});
            });
        })
    })
    .then(data => {
        return new UserModel({
            tagId: data.tagId,
            passwd: data.passwd,
            passwdSalt: data.passwdSalt,
            name: req.body.name,
            regiment: req.body.regiment,
            rank: req.body.rank,
            recentLogin: new Date(),
            relatedDocs: {
                created: [],
                shared: [],
            }
        });
    })
    .then(newU => { 
        return newU.save();
    })
    .then(() => res.status(201).end())
    .catch(e => {
        console.error(e);
        res.status(400).json(e);
    });
});

// 유저 정보 수정
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
    //console.log(req.body);
    Promise.all([
        checkLogined(req.session!),
        getTagId(req.params.id)
    ])
    .then(value => {
        // 로그인 한 유저가 수정하려는건지 확인
        return {tagId: value[0], perm: value[0] === value[1]};
    })
    .then(async data => {
        let active = false;
        if (data.perm) {
            // 본인의 정보 수정
            if (req.body.passwd) {
                // 패스워드 변경시
                crypto.randomBytes(64, (err, buf) => {
                    crypto.pbkdf2(req.body.passwd, buf.toString('base64'), 1231, 64, 'sha512', (err, key) => {
                        req.body.passwd = key.toString('base64');
                    });
                    req.body.passwdSalt = buf.toString('base64');
                });
                await UserModel.update({ tagId: data.tagId }, {...req.body});
                active = true;
            }
            if (req.body.tags) {
                // 태그 추가 및 제거시 <- 태그와 같이오는 action 문자열로 동작
                // in: tags.name, tags.color, tags.action
                if (req.body.tags.action === 'add') {
                    // 태그 추가
                    try {
                        const usr = await UserModel.findOne({ tagId: data.tagId });
                        let newTag: Tag = {
                            name: req.body.tags.name,
                            color: req.body.tags.color,
                        };
                        usr?.tags.push(newTag);
                        await usr?.save();
                        active = true;
                    } catch (e) {
                        throw new Error(e);
                    }
                } else if (req.body.tags.action === 'del') {
                    if (req.body.tags.idx > 3) {
                        // 태그 삭제
                        try {
                            const usr_1 = await UserModel.findOne({ tagId: data.tagId });
                            usr_1?.tags.splice(req.body.tags.idx, 1);
                            await usr_1?.save();
                            active = true;
                        } catch (e_1) {
                            throw new Error(e_1);
                        }
                    } else {
                        // 기본태그는 삭제 불가능
                        throw new Error(`Default tag cannot be removed`);
                    }
                }
            }
            if (req.body.docTags) {
                // 문서의 태그 수정 <- action 문자열로 동작
                // in: docTags.action, docTags.docId, docTags.tagId
                if (req.body.docTags.action === 'default') {
                    // 기본 태그 변경시
                    try {
                        const docInfo = await DocInfoModel.findById(req.body.docTags.docId);
                        docInfo!.status = Number(req.body.docTags.tagId) as DocStatus;
                        await docInfo?.save();
                        active = true;
                    } catch (e) {
                        throw new Error(e);
                    }
                } else if (req.body.docTags.action === 'add') {
                    // 유저 태그 추가시
                    try {
                        const usr = await UserModel.findOne({ tagId: data.tagId });
                        const createdDocIdx = usr?.relatedDocs.created.findIndex(docView => docView.docId == req.body.docTags.docId);
                        const sharedDocIdx = usr?.relatedDocs.shared.findIndex(docView => docView.docId == req.body.docTags.docId);
                        if (createdDocIdx! >= 0) {
                            usr?.relatedDocs.created[createdDocIdx!].docTags.push(Number(req.body.docTags.tagId));
                            usr?.relatedDocs.created[createdDocIdx!].docTags.sort((a, b) => {return Number(a) - Number(b)});
                        } else if (sharedDocIdx! >= 0) {
                            usr?.relatedDocs.shared[sharedDocIdx!].docTags.push(Number(req.body.docTags.tagId));
                            usr?.relatedDocs.shared[sharedDocIdx!].docTags.sort((a, b) => {return Number(a) - Number(b)});
                        }
                        usr?.markModified('relatedDocs');
                        await usr?.save();
                        active = true;
                    } catch (e) {
                        throw new Error(e);
                    }
                } else if (req.body.docTags.action === 'del') {
                    // 유저 태그 삭제시
                    try {
                        const usr = await UserModel.findOne({ tagId: data.tagId });
                        const createdDocIdx = usr?.relatedDocs.created.findIndex(docView => docView.docId == req.body.docTags.docId);
                        const sharedDocIdx = usr?.relatedDocs.shared.findIndex(docView => docView.docId == req.body.docTags.docId);
                        if (createdDocIdx! >= 0) {
                            const delIdx = usr?.relatedDocs.created[createdDocIdx!].docTags.findIndex(num => num == Number(req.body.docTags.tagId));
                            if (delIdx! >= 0) usr?.relatedDocs.created[createdDocIdx!].docTags.splice(delIdx!, 1);
                        } else if (createdDocIdx! >= 0) {
                            const delIdx = usr?.relatedDocs.shared[sharedDocIdx!].docTags.findIndex(num => num == Number(req.body.docTags.tagId));
                            if (delIdx! >= 0) usr?.relatedDocs.shared[sharedDocIdx!].docTags.splice(delIdx!, 1);
                        }
                        usr?.markModified('relatedDocs');
                        await usr?.save();
                        active = true;
                    } catch (e) {
                        throw new Error(e);
                    }
                }
            }
            if (req.body.memos) {
                // 메모(TODO) 수정
                // in: memos
                //console.log(req.body.memos);
                const usr = await UserModel.findOne({ tagId: data.tagId });
                usr!.memos = req.body.memos;
                usr?.markModified('memos');
                await usr?.save();
                active = true;
            }
        }
        // 본인 또는 타인의 정보 수정 - alert, 등등?
        /// 뭐라도 하겠지 WIP
        
        // req가 유효했는지 체크
        if (active) {
            return;
        } else {
            throw new Error(`Invalid PUT Request on ${req.params.id}`);
        }
    })
    .then(() => res.status(200).end())
    .catch(e => {
        console.error(e);
        res.status(400).json(e);
    });    
});

// 유저 정보 삭제
// 연관된 문서도 삭제해야되는지는 고민중
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
    Promise.all([
        checkLogined(req.session!),
        getTagId(req.params.id)
    ])
    .then(value => {
        // 로그인 한 유저가 수정하려는건지 확인
        if (value[0] === value[1]) {
            return value[0];
        } else {
            throw new Error('No permission');
        }
    })
    .then(n => {
        UserModel.remove({ tagId: n })
    })
    .then(() => res.status(200).end())
    .catch(e => res.status(400).end());
});

// 문자열 군번값이 유효한지 확인해주는 친구...?
export function getTagId(id: string, checkDuplicated: boolean = false, checkHasUser: boolean = false) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (checkDuplicated) {
            UserModel.findOne({ tagId: id })
            .then(usr => {
                if (checkHasUser) {
                    if (usr !== null) {
                        resolve(id);
                    } else {
                        reject(new Error(`User with id: ${id} is not exists`));
                    }
                } else {
                    if (usr === null) {
                        resolve(id);
                    } else {
                        reject(new Error(`User with id: ${id} is already exists`));
                    }
                }
            })
        } else {
            resolve(id);
        }
    });
}

export function checkLogined(session: Express.Session) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (session.dbId && session.tagId) {
            resolve(session.tagId);
        } else {
            reject(Error('Not Logined'));
        }
    })
}

export default router;
