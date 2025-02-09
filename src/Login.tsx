import {useAuth0} from '@auth0/auth0-react'
import {useEffect} from 'react'
import { useNavigate } from 'react-router-dom'

const Login = () => {
 const {loginWithRedirect, user, getAccessTokenSilently} = useAuth0()
 const navigate = useNavigate();

 useEffect(() => {
  if (user) {
   (async () => {
    const token = await getAccessTokenSilently();
    navigate('/home');
   })();
  }
 }, [user]);
    const handleLogin = () => {
        console.log("hllos",loginWithRedirect)
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