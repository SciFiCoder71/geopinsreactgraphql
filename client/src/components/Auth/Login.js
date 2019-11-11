import React, { useContext } from "react";
import { withStyles } from "@material-ui/core/styles";
import { GoogleLogin } from 'react-google-login';
import { GraphQLClient } from 'graphql-request';

import { fromPromise } from "apollo-link";
import Typography from "@material-ui/core/Typography";
import Context from '../../store/context';
import { ME_QUERY } from '../../graphql/queries';


const Login = ({ classes }) => {

  const { dispatch } = useContext(Context);

  const onSuccess = async (googleUser) => {

    try {
      const idToken = googleUser.getAuthResponse().id_token;

      const client = new GraphQLClient('http://localhost:4000/graphql', {
        headers: { authorization: idToken }
      });

      const { me } = await client.request(ME_QUERY);

      dispatch({ type: "LOGIN_USER", payload: me });
      dispatch({ type: "IS_LOGGED_IN", payload: googleUser.isSignedIn()});

    } catch (err) {
      onFailure('error from login component...' + err);
    }


  }

  const onFailure = err => {
    console.log("Error logging in", err)
  }
  return (
    <div className={classes.root}>
      <Typography component="h1" variant="h3" gutterBottom noWrap style={{ color: "rgb(66, 133, 244)"}}>
        Welcome
      </Typography>
      <GoogleLogin
        clientId="840430013841-9uim7tsqg6foe26ada4g30vqu6str964.apps.googleusercontent.com"
        onSuccess={onSuccess}
        onFailure={onFailure}
        isSignedIn={true}
        theme="dark"
        buttonText="Login with Google"
      />
    </div>
  )
};

const styles = {
  root: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    alignItems: "center"
  }
};

export default withStyles(styles)(Login);