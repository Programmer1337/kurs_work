import './App.css';
import React from "react";
import axios from 'axios'
import {response} from "express";


function App() {

    console.log('1234')
    axios.get('http://localhost:8000/files').then(response => {
        console.log(response)
    }).catch(error=>{
        console.log(error)
    })
    return (
        <div>
            <h1>React</h1>
        </div>
    );
}

export default App;
