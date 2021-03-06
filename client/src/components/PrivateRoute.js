import React from "react";
import {Route , Redirect} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
function PrivateRouter({component:Component ,  ...rest}){
    const {currentUser} = useAuth();
    return <Route
      {...rest}
      render={props => {
        return currentUser ? (<Component {...props} /> ): (<Redirect to="/login" />)
      }}
    />
    
}

export default PrivateRouter;