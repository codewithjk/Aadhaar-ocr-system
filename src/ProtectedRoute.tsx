import {useAuth0,} from '@auth0/auth0-react'

import {Navigate} from 'react-router-dom'
const ProtectedRoute = ({children}: {children: JSX.Element}) => {
    const { isAuthenticated } = useAuth0();
    console.log(isAuthenticated)
  
    if (!isAuthenticated) {
      return <Navigate to="/" />;
    }
  
    return children;
  };
  
export default ProtectedRoute