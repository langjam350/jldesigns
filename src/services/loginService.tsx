import { db, auth } from '../../lib/firebase'
import { addDoc, collection, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
//import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import bcrypt from 'bcryptjs'; // Import bcryptjs for password hashing
import IUserInfo from '../models/IUserInfo';

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
              //  return false;a
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
            UserInfoList.forEach(async user => {
                if(user.email = this.email) {
                    var bool = await bcrypt.compare(user.password, password)
                    console.log('Email Found.' + bool);
                    if (bool) {
                        console.log('Password Found.');
                        this.loggedIn = true
                        process.env.USER_EMAIL = this.email
                    }
                } 
            })
            
            if (this.loggedIn) {
              // User information found in Firestore
              return true
              // You can now use userInfo in your application as needed
            } else {
              // No user information found in Firestore
              console.log('User information not found.');
              return false
            }
            
            // Optionally, you can navigate to another page upon successful sign-in
            // router.push('/dashboard');
            
          } catch (error) {
            console.error('Sign in error:', error);
            // Handle sign-in error (e.g., display error message to the user)
            return false
          }
    };

    async handleSignUp(email: string, password: string): Promise<boolean> {
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

            return true;
        } catch(error) {
            console.error('Error adding user:', error);
            throw error;
        } 
    }
}

export default LoginService