import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import { useLocation , useNavigate , Navigate , useParams } from 'react-router-dom';
import ACTIONS from '../Actions';

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const {roomId} = useParams();
  const reactNavigator = useNavigate();

  const [clients, setClients] = useState([]);

  useEffect(()=>{
    const init = async ()=>{
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error',(err)=> handleErrors(err));
      socketRef.current.on('connect_failed',(err)=>handleErrors(err));

      function handleErrors(e){
        console.log('socket error',e);
        toast.error('Socket conncetion falied , try again later');
        reactNavigator('/');
      }

      socketRef.current.emit(ACTIONS.JOIN,{
        roomId,
        username: location.state?.username,
      });


      //Listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({clients,username,socketId})=>{
          if(username !== location.state?.username){
            toast.success(`${username} joined the room.`)
            console.log(`${username} joined`)
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code : codeRef.current,
            socketId,
          });
      });


      //listening for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED,({socketId,username})=>{
        toast.success(`${username} left the room.`);
        setClients((prev)=>{
          return prev.filter(
            (client) => client.socketId!= socketId
          )
        })
      })
    };
    init();
    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.disconnect();
      }
    };    
  },[])

  // copy room id 
  async function copyRoomId(){
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success('Room Id has been copied to your clipboard')
    } catch (err) {
      toast.error('Could not copy Room Id')
      console.error(err);
    }
  }

 //leaving room function
 function leaveRoom(){
  reactNavigator('/');
 }

  if(!location.state){
    return <Navigate to="/"/>
  }


  return (
    <div className='mainWrap'>
      {/* Aside Section */}
      <div className='aside'>
        <div className='asideInner'>
          <div className='logo'>
            <img className='logoImage' src='/code-syntax.png' alt='logo' />
          </div>
          <h3>Connected</h3>
          <div className='clientsList'>
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        {/* Buttons */}
        <button className='btn copyBtn' onClick={copyRoomId}>Copy ROOM ID</button>
        <button className='btn leaveBtn' onClick={leaveRoom}>Leave</button>
      </div>

      {/* Editor Section */}
      <div className='editorWrap'>
        <Editor 
        socketRef={socketRef} 
        roomId={roomId} 
        onCodeChange={(code)=>{
          codeRef.current = code;
          }}
        />
      </div>
    </div>
  );
};

export default EditorPage;