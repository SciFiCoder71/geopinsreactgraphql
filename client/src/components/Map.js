import React, {useState, useEffect, useContext} from "react";
import ReactMapGL, {NavigationControl, Marker, Popup} from 'react-map-gl';
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";
import PinIcon from '../components/PinIcon';
import Context from '../store/context';
import Blog from '../components/Blog';
import { useClient } from '../client';
import { GET_PINS_QUERY } from '../graphql/queries';
import differenceInMinutes from 'date-fns/difference_in_minutes';
import { DELETE_PIN_MUTATION } from '../graphql/mutations';
import { Subscription } from "react-apollo";
import {PIN_ADDED_SUBSCRIPTION,PIN_UPDATED_SUBSCRIPTION,PIN_DELETED_SUBSCRIPTION} from "../graphql/subscriptions";


const INITIAL_VIEWPORT = {
  latitude: 37.7577,
  longitude: -122.4376,
  zoom: 13
};


const Map = ({ classes }) => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);
  const [viewport, setViewport] = useState(INITIAL_VIEWPORT)
  const [userPosition, setUserPostion] = useState(null);
  const [popup, setPopup] = useState(null);

  useEffect(()=>{
    getUserPosition();
  },[]);

  useEffect(()=>{
    getPins();
  },[]);

  const getPins = async () => {
    const { getPins } = await client.request(GET_PINS_QUERY);
    console.log('pins...' + JSON.stringify(getPins));
    dispatch({ type: "GET_PINS", payload: getPins });
  };


  const getUserPosition = () => {
    if("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        const {latitude, longitude} = position.coords;

        setViewport({
          ...viewport,
          latitude,
          longitude
        });

        setUserPostion({
          latitude,
          longitude
        });

      })
    }
  }

  const handleMapClick = e => {
    let targ = e.target;
    
    while (targ !== null) {
        if (targ.classList.contains(classes.popupTab)) return;
        targ = targ.parentElement;
    }
    
    const { lngLat, leftButton } = e;

    if (!leftButton) return;

      if (!state.draft) {
        dispatch({ type: 'CREATE_DRAFT' })
      }
   
      const [ longitude, latitude ] = lngLat
   
      dispatch({
        type: 'UPDATE_DRAFT_LOCATION',
        payload: { 
          longitude,
          latitude
        }
      })
  }

  const highlightNewPin = pin => {
    const isNewPin =
      differenceInMinutes(Date.now(), Number(pin.createdAt)) <= 30;
    return isNewPin ? "limegreen" : "darkblue";
  };

  const handleSelectPin = pin => {
    setPopup(pin);
    dispatch({ type: "SET_PIN", payload: pin });
  };


  const isAuthUser = () => state.currentUser._id === popup.author._id;

  const handleDeletePin = async pin => {
    const variables = { pinId: pin._id };
    await client.request(DELETE_PIN_MUTATION, variables);
    setPopup(null);
  };



  return (
    <div className={classes.root}>
      <ReactMapGL
       width="100vw"
       height="100vh"
       mapStyle="mapbox://styles/mapbox/streets-v9"
       onClick={handleMapClick}
       onViewportChange={newViewport => setViewport(newViewport)}
       mapboxApiAccessToken="pk.eyJ1Ijoic2NpZ2FtYSIsImEiOiJjazBqam85emYwODhrM2Rtcjl3czJwZWR1In0.BgKedvSR-X58XN_bcJlpsg"
       {...viewport}>
         <div className={classes.navigationControl}>
          <NavigationControl
           onViewportChange={newViewport => setViewport(newViewport)}
          />
        </div>
        {userPosition && (
          <Marker
            latitude={userPosition.latitude}
            longitude={userPosition.longitude}
            offsetLeft={-19}
            offsetTop={-37}
          >
            <PinIcon  size={40} color="red" />
          </Marker>
        )}

        {/* Draft Pin */}
        {state.draft && (
          <Marker
            latitude={state.draft.latitude}
            longitude={state.draft.longitude}
            offsetLeft={-19}
            offsetTop={-37}
          >
            <PinIcon size={40} color="hotpink" />
          </Marker>
        )}

        {/*Present Pin*/}
        
        {state.pins.map(pin =>(
          <Marker
          key={pin._id}
          latitude={pin.latitude}
          longitude={pin.longitude}
          offsetLeft={-19}
          offsetTop={-37}
        >
          <PinIcon 
            onClick={()=> handleSelectPin(pin)} 
            size={40} 
            color={highlightNewPin(pin)} 
          />

        </Marker>
        ))}

          {/*Popup dialog*/}
          {popup && (
            <Popup
              anchor="top"
              latitude={popup.latitude}
              longitude={popup.longitude}
              closeOnClick={false}
              onClose={()=>setPopup(null)}
              >
                <img
                  className={classes.popupImage}
                  src={popup.image}
                  alt={popup.title}
                />
                <div className={classes.popupTab}>
                  <Typography>
                    {popup.latitude.toFixed(6)}, {popup.longitude.toFixed(6)}
                  </Typography>
                  {isAuthUser() && (
                    <Button onClick={()=> handleDeletePin(popup)}>
                      <DeleteIcon className={classes.DeleteIcon}/>
                    </Button>
                  )}
                </div>
            </Popup>
          )}
      </ReactMapGL>
      <Subscription
        subscription={PIN_ADDED_SUBSCRIPTION}
        onSubscriptionData={({ subscriptionData }) => {
          const { pinAdded } = subscriptionData.data;
          console.log({ pinAdded });
          dispatch({ type: "CREATE_PIN", payload: pinAdded });
        }}
      />
      <Subscription
        subscription={PIN_UPDATED_SUBSCRIPTION}
        onSubscriptionData={({ subscriptionData }) => {
          const { pinUpdated } = subscriptionData.data;
          console.log({ pinUpdated });
          dispatch({ type: "CREATE_COMMENT", payload: pinUpdated });
        }}
      />
      <Subscription
        subscription={PIN_DELETED_SUBSCRIPTION}
        onSubscriptionData={({ subscriptionData }) => {
          const { pinDeleted } = subscriptionData.data;
          console.log({ pinDeleted });
          dispatch({ type: "DELETE_PIN", payload: pinDeleted });
        }}
      />
      <Blog/>
    </div>
  )
};

const styles = {
  root: {
    display: "flex"
  },
  rootMobile: {
    display: "flex",
    flexDirection: "column-reverse"
  },
  navigationControl: {
    position: "absolute",
    top: 0,
    left: 0,
    margin: "1em"
  },
  deleteIcon: {
    color: "red"
  },
  popupImage: {
    padding: "0.4em",
    height: 200,
    width: 200,
    objectFit: "cover"
  },
  popupTab: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column"
  }
};

export default withStyles(styles)(Map);
