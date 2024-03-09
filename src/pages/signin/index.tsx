// pages/signin.js
import React, { useState } from 'react';
import Link from 'next/link';
import '../../app/globals.css'
import LoginService from '../../services/LoginService'
import { useRouter } from 'next/router';

const SignInPage = () => {
    const [formData, setFormData] = useState({
        // Initialize form data state
        // For example:
        email: '',
        password: ''
      });

    const loginService = new LoginService(); // Instantiate the LoginService
    const router = useRouter();

    var loggedIn;

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        if (e.type =='submit') {
            e.preventDefault();
            loginService.setEmail(formData.email);
            loginService.setPassword(formData.password);
            console.log("signing in user " + formData.email)
            var loggedIn = await loginService.handleSignIn(formData.email, formData.password);
            console.log(loggedIn)
            if (loggedIn) {
                router.push('/blog')
            }
        }
        
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
          ...formData,
          [name]: value
        });
      };

    return (
        <div className="min-h-screen flex items-center justify-center sm:px-6 lg:px-8 text-primary ">
            <div className="max-w-md w-full bg-accent rounded-md justify-center text-center">
                <div>
                    <h2 className="mt-6 text-center text-3xl text-primary font-bold">Sign in to your account</h2>
                </div>
                <form className="mt-8 space-y-6 justify-center items-center" onSubmit={handleSignIn}>
                    <input type="hidden" name="remember" value="true" />
                    <div className="rounded-md mx-auto">
                        <input id="email" name="email" type="text" autoComplete="email" required className="mx-auto max-w-screen-md w-80 rounded-t-md px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900  focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Username" value={formData.email} onChange={handleChange} />
                        <input id="password" name="password" type="password" autoComplete="current-password" required className="mx-auto max-w-screen-md w-80 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password" value={formData.password} onChange={handleChange} />
                    </div>

                    <div className="mx-auto max-w-screen-md w-80 text-sm">
                        <Link href="/account-recovery">
                            Trouble with Account?
                        </Link>
                    </div>
                    <div className="mx-auto max-w-screen-md w-80 text-sm">
                        <Link href="/signup">
                            Create An Account
                        </Link>
                    </div>
                    <div>
                        <button type="submit" className="mx-auto max-w-screen-md w-80 w-80 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Sign in
                        </button>
                    </div>
                    
                    <div className="text-sm font-bold mx-auto max-w-screen-md w-80">
                        <Link href="/" >
                        Back to Site
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignInPage;