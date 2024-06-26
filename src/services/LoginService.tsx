import { db, auth } from '../../lib/firebase'
import { addDoc, collection, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
//import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import bcrypt from 'bcryptjs'; // Import bcryptjs for password hashing
import IUserInfo from '../models/IUserInfo';
import AuthService from './AuthService';

class LoginService {
    email = '';
    password = '';
    loggedIn;

    constructor() {
        this.email = '';
        this.password = '';
        this.loggedIn = false;
    }
    
    setEmail(email: string) {
        this.email = email;
    }
    
    setPassword(password: string) {
        this.password = password;
    }

    setLoggedIn(loggedIn: boolean) {
        this.loggedIn = loggedIn
    }


    async handleSignIn(email: string, password: string): Promise<Boolean> {
        try {
            this.email = email

            const hashedPassword = await bcrypt.hash(this.password, 10)
            this.password = hashedPassword

            // Sign in the user with email and password
            //const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
            //if (!userCredential) {
              //  return false;
            //}

            // Now, access the "userInfo" collection in Firestore
            var UserInfoList: IUserInfo[] = [];
            const userInfoCollection = collection(db, 'userInfo');
            console.log("getting collection")
            var querySnapshot = await getDocs(userInfoCollection);  
            querySnapshot.forEach((doc: QueryDocumentSnapshot) => {
                const data = doc.data();
                const userInfo: IUserInfo = {
                    id: data.id,
                    email: data.email,
                    password: data.password,
                    resetPassword: data.resetPassword,
                    resetUsername: data.resetUsername,
                };
                UserInfoList.push(userInfo);
            });
            console.log("get user info")
            var loginResult = false;
            UserInfoList.forEach(async user => {
                if(user.email == this.email) {
                    await bcrypt.compare(password, user.password, function(err, result) {
                        if (err) {
                            // Handle error
                            console.error('Error comparing passwords:', err);
                            return Promise.resolve(false);
                        }
                        if (result) {
                            console.log("User " + email + " is logged in")
                            loginResult = true
                            AuthService.signIn(email)
                            return Promise.resolve(true);
                        } else {
                            
                            console.log('Passwords do not match'); // The plaintext password does not match the hashed password
                            return Promise.resolve(false);
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Sign in error:', error);
            // Handle sign-in error (e.g., display error message to the user)
            return Promise.resolve(false)
        }
        return Promise.resolve(false);
    };

    async handleSignUp(email: string, password: string): Promise<Boolean> {
        try {
           // const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);

            //if (!userCredential) {
              //  console.log("credential validation unsuccessful")
                //return false;
            //}

            const hashedPassword = await bcrypt.hash(password, 10);

            const userInfo: IUserInfo = {
                id: Math.floor(Math.random() * 10000) + 1,
                email: email,
                password: hashedPassword, 
                resetPassword: false,
                resetUsername: false
            }

            const userInfoCollection = collection(db, 'userInfo');
            await addDoc(userInfoCollection, userInfo);
            console.log('User added successfully:');

            return Promise.resolve(true)
        } catch(error) {
            console.error('Error adding user:', error);
            return Promise.resolve(false)
        }
    }
}

export default LoginService
