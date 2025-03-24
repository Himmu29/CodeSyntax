import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror'; // Core CodeMirror
import 'codemirror/lib/codemirror.css'; // Core CSS
import 'codemirror/theme/dracula.css'; // Dracula theme
import 'codemirror/mode/javascript/javascript'; // JavaScript mode
import 'codemirror/addon/edit/closetag'; // Auto-close tags
import 'codemirror/addon/edit/closebrackets'; // Auto-close brackets
import 'codemirror/addon/display/autorefresh'; // Ensure proper rendering
import ACTIONS from '../Actions';

const Editor = ({socketRef , roomId, onCodeChange}) => {
  const editorRef = useRef(null);
  useEffect(() => {
    async function init() {
        editorRef.current = Codemirror.fromTextArea(document.getElementById('realtimeEditor'), {
        mode: { name: 'javascript', json: true }, // JavaScript mode
        theme: 'dracula', // Dracula theme
        autoCloseTags: true, // Auto-close HTML/XML tags
        autoCloseBrackets: true, // Auto-close brackets
        lineNumbers: true, // Show line numbers
        autorefresh: true, // Ensure proper rendering
      });

      

      editorRef.current.on('change',(instance,changes)=>{
        const {origin} = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if(origin !== 'setValue'){
          socketRef.current.emit(ACTIONS.CODE_CHANGE,{
            roomId,
            code,
          });
        }
      })

      
    }
    init();
  }, []);

  useEffect(()=>{
    if(socketRef.current){
      socketRef.current.on(ACTIONS.CODE_CHANGE,({code})=>{
        if(code !== null){
          editorRef.current.setValue(code);
        }
      });
    }
    return ()=>{
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    }
    
  },[socketRef.current]);

  return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;