import Link from 'next/link'

const Button = () => {
    return (
      <Link className="rounded-lg flex items-center justify-center h-12 bg-white font-bold px-5 " href="/signin">Sign In</Link>
    );
  };
  export default Button;