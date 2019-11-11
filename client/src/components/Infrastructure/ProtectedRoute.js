import React, { useContext } from 'react';
import Context from '../../store/context';
import { Route } from 'react-router-dom';
import { Redirect } from 'react-router-dom';

const ProtectRoute = ({ component: Component, ...rest }) => {

    //extract state off Context to get state.
    const { state } = useContext(Context);

    return (
        <Route render={props=>
            !state.isAuth ? <Redirect to="/login"/> : <Component {...props}/>}
            {...rest}/>
    )
}

export default ProtectRoute;