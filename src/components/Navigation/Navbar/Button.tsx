import Link from 'next/link'

const Button = () => {
  if(process.env.USER_EMAIL) {
    return (
      <Link className="rounded-lg flex items-center justify-center h-12 font-bold px-5 " href="/">Signed In As {process.env.USER_EMAIL}</Link>
    )  
  }

  return (
    <Link className="rounded-lg flex items-center justify-center h-12 bg-white font-bold px-5 " href="/signin">Sign In</Link>
  ) 
    
};
export default Button;