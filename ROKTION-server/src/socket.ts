import SocketIO from "socket.io";

interface UserSocket extends SocketIO.Socket {
    tagId: string;
    currentDocument: string,
    currentPage: number,
}

const createSocketActions = (io: SocketIO.Server, socket: SocketIO.Socket) => {
    // 소켓에 간단한 유저데이터 넣기
    socket.on('linkData', (userData) => { // tagId: 유저의 군번, 
        (socket as UserSocket).tagId = userData.tagId;
        // (socket as UserSocket).tagId 로 확인가능
    })

    // 내용 업데이트시 GET을 호출하도록
    socket.on('updateDocInfo', (docData) => { // docId: 문서의 ID
        socket.broadcast.emit('updateDocInfo', docData);
    })

    // 페이지 수정중 다른 사람이 수정 못하게
    socket.on('enterDocumentPage', (docData) => { // docId: 보고있는 문서 ID, pageIdx: 보고있는 페이지 번호

    })
    socket.on('startPageEditing', (editing) => { // editingPage: 수정중인 페이지 번호
        // 혼자만 접속중이면 안보내도됨
    })
    socket.on('endPageEditing', (editing) => { // editingPage: 수정을 완료한 페이지 번호

    })
}

export default createSocketActions;
