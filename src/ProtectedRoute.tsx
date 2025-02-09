import {useAuth0, withAuthenticationRequired} from '@auth0/auth0-react'
import {ComponentType} from 'react'
import {Navigate} from 'react-router-dom'

const ProtectedRoute = ({children}: {children: ComponentType}) => {
 const {isAuthenticated} = useAuth0()

 const ProtectedComponent = withAuthenticationRequired(children)

 if (!isAuthenticated) {
  return <Navigate to='/' />
 }

 return <ProtectedComponent />
}

export default ProtectedRoute