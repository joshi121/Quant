import {createBrowserRouter , RouterProvider} from "react-router-dom"
import Home from "./pages/Home.jsx"
import Login from "./pages/Login.jsx"
import Signup from "./pages/Signup.jsx"

import './App.css'

const router = createBrowserRouter([
  {
    path : "/",
    element : <Home/>
  },
  {
    path : "/register",
    element : <Signup/>

  },
  {
    path : "/login",
    element : <Login/>
  }
]);

function App() {
  return (
    <>
      <div className="App">
          <RouterProvider router  = {router}/>
      </div>
    </>
  )
}

export default App
