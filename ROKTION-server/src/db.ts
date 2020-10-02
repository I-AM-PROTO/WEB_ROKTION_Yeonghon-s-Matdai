import mongoose from 'mongoose';
import { User, UserModel } from './schemas/user';

const url = 'mongodb://localhost:27017/roktion_dev';

export class DB {
    constructor() {}

    initalConnect() {
        const connect = () => {
            mongoose.connect(url, (err) => {
                if (err) {
                    console.error('DB connection error', err);
                } else {
                    console.log('DB connected');
                }
            });
        }
        connect();
        mongoose.connection.on('disconnected', connect);
    
        require('./schemas/user');
    }

    create(user: User) : Promise<User> {
        let u = new UserModel(user);
        return u.save();
    }

    read(query: any): mongoose.DocumentQuery<User[], User> {
        return UserModel.find(query);
    }

    update(user: User): mongoose.DocumentQuery<User[], User> {
        return UserModel.update({name: user.name}, {...user});
    }
}
