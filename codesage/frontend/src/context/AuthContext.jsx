import { createContext, useContext, useState } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem("codesage_auth") === "true"
  )

  const login = (username, password) => {
    if (username === "user" && password === "1234") {
      sessionStorage.setItem("codesage_auth", "true")
      setIsLoggedIn(true)
      return true
    }
    return false
  }

  const logout = () => {
    sessionStorage.removeItem("codesage_auth")
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
