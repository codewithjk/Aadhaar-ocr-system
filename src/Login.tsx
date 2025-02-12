import {useAuth0} from '@auth0/auth0-react'
import {useEffect} from 'react'
import { useNavigate } from 'react-router-dom'

const Login = () => {
 const {loginWithRedirect, user, } = useAuth0()
    const navigate = useNavigate();
    
    console.log(user)

    // useEffect(() => {
    //     if (user) {
    //       getAccessTokenSilently().then(() => {
    //         navigate('/home');
    //       });
    //     }
    //   }, [user, getAccessTokenSilently, navigate]);
      
    const handleLogin = () => {
        console.log("handling login",loginWithRedirect)
        loginWithRedirect()
    }

 return (
  <div className='flex w-full h-screen items-center justify-center bg-gray-500'>
   <div
    className='bg-gray-300 text-black border-2 h-fit p-4 rounded-sm cursor-pointer'
    onClick={handleLogin}>
    Login
   </div>
  </div>
 )
}

export default Login