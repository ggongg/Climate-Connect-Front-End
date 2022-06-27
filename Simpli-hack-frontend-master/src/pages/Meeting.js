import React, { useEffect, useRef, useState, useContext } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { FaTree, FaShare, FaSignOutAlt } from "react-icons/fa";
import "../css/meeting.css";
import { Context } from "../states/Provider";
import { Buffer } from "buffer";
import Modal from "react-modal";
import axios from "axios";
import gaga from "./gaga.mp3";
import earth from "./earth.gif";

const customStyles = {
  overlay: {
    "background-color": "rgba(0, 0, 0, 0.75)",
  },
  content: {
    fontFamily: "Rubik",
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

// Make sure to bind modal to your appElement (https://reactcommunity.org/react-modal/accessibility/)
Modal.setAppElement("#root");

window.Buffer = window.Buffer || Buffer;

const getEnviroCategory = (value) => {
  switch (parseInt(value)) {
    case 0:
      return "☀️";
    case 1:
      return "🏫";
    case 2:
      return "🎟️";
    case 3:
      return "💪";
    case 4:
      return "🌳";
    case 5:
      return "🧾";
    default:
      return "🏠";
  }
};

const Video = (props) => {
  const ref = useRef();

  useEffect(() => {
    props.peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, []);

  return <video {...props} class="user-video" playsInline autoPlay ref={ref} />;
};

const Room = (props) => {
  const videoRef = useRef(null);

  const [state] = useContext(Context);
  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  const roomID = "123";
  const videoConstraints = {
    minAspectRatio: 1.333,
    minFrameRate: 60,
    height: window.innerHeight / 1.8,
    width: window.innerWidth / 2,
  };

  const createStream = () => {
    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: true })
      .then((stream) => {
        userVideo.current.srcObject = stream;
        socketRef.current.emit("join room", {
          roomID,
          instrument: state.instrument,
        });
        socketRef.current.on("all users", (users) => {
          //console.log(users);
          const peers = [];
          users.forEach((user) => {
            const peer = createPeer(
              user.callerID,
              socketRef.current.id,
              stream,
              user.instrument
            );
            peersRef.current.push({
              peerID: user.callerID,
              peer,
              instrument: user.instrument,
            });
            peers.push({
              peerID: user.callerID,
              peer,
              instrument: user.instrument,
            });
          });
          setPeers(peers);
        });
        socketRef.current.on("user joined", (payload) => {
          console.log("==", payload);
          const peer = addPeer(payload.signal, payload.callerID, stream);
          peersRef.current.push({
            peerID: payload.callerID,
            peer,
            instrument: payload.instrument,
          });
          const peerObj = {
            peer,
            peerID: payload.callerID,
            instrument: payload.instrument,
          };
          setPeers((users) => [...users, peerObj]);
        });

        socketRef.current.on("user left", (id) => {
          const peerObj = peersRef.current.find((p) => p.peerID === id);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          const peers = peersRef.current.filter((p) => p.peerID !== id);
          peersRef.current = peers;
          setPeers(peers);
        });

        socketRef.current.on("receiving returned signal", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          item.peer.signal(payload.signal);
        });
      });
  };

  function createPeer(userToSignal, callerID, stream, instrument) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
        instrument,
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  let subtitle;
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [friendEmail, setFriendEmail] = React.useState("");

  function openModal() {
    setIsOpen(true);
    console.log("hello");
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
    subtitle.style.color = "#f00";
  }

  function closeModal() {
    setIsOpen(false);
  }

  useEffect(() => {
    socketRef.current = io.connect(
      "https://simpli-hack-backend.herokuapp.com/"
    );
    createStream();
  }, []);

  return (
    <div class="background d-flex align-items-center justify-content-center flex-column">
      <div class="container-0">
        <h1>{getEnviroCategory(state.instrument)}</h1>
        <video muted class="user-video" ref={userVideo} autoPlay playsInline />
      </div>

      <div class="container-1">
        {peers[0] ? (
          <>
            <h1>{getEnviroCategory(2)}</h1>
            <Video peer={peers[0].peer} />
          </>
        ) : (
          <img
            class="user-video"
            src="https://media.discordapp.net/attachments/983583262372945950/990535925358546964/Envireo_3.png"
          />
        )}
      </div>

      <div class="container-2">
        {peers[1] ? (
          <>
            <h1>{getEnviroCategory(2)}</h1>
            <Video peer={peers[1].peer} />
          </>
        ) : (
          <img
            class="user-video"
            src="https://media.discordapp.net/attachments/983583262372945950/990535925358546964/Envireo_3.png"
          />
        )}
      </div>

      <div class="container-3">
        {peers[2] ? (
          <>
            <h1>{getEnviroCategory(2)}</h1>
            <Video peer={peers[2].peer} />
          </>
        ) : (
          <img
            class="user-video"
            src="https://media.discordapp.net/attachments/983583262372945950/990535925358546964/Envireo_3.png"
          />
        )}
      </div>

      <img class="bonfire" src={earth} />

      <div class="bottom-features d-flex align-items-center justify-content-center">
        <FaSignOutAlt
          color="white"
          size={30}
          className="mx-5"
          onClick={() => {
            window.location.href = "/select";
          }}
        />
        <FaTree
          color="#5BF921"
          size={30}
          className="mx-5"
          onClick={() => {
            videoRef.current.play();
          }}
        />
        <FaShare color="white" size={30} className="mx-5" onClick={openModal} />
      </div>
      <video ref={videoRef} height={0} src={gaga}></video>

      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Invite friends"
      >
        <h2 ref={(_subtitle) => (subtitle = _subtitle)}>Invite</h2>
        <div class="d-flex align-items-center mt-3">
          <input
            class="send-email-input"
            type="text"
            aria-describedby="sendEmail"
            placeholder="Email"
            onChange={(e) => setFriendEmail(e.target.value)}
          />
          <button
            class="btn btn-danger"
            onClick={(e) => {
              e.preventDefault();

              axios
                .post(
                  "https://simpli-hack-backend.herokuapp.com/invite_friends",
                  {
                    email: friendEmail,
                  }
                )
                .then((res) => {
                  console.log(res.data);
                })
                .catch((error) => {
                  console.log(error.response.data);
                });

              closeModal();
            }}
          >
            Send
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Room;
