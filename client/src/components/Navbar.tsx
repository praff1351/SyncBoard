import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";


const Navbar = ()=>{
  const {isDark, toggleTheme} =  useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout =()=>{
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate('/');
  }

  return(
    <nav className="border-b border-border px-6 py-4 flex items-center justify-between bg-purple-50 dark:bg-purple-950/20">
      <Link to={"/"} className="text-xl font-semibold tracking-tight">
      SyncBoard
      </Link>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDark ? <Sun size={18}/> : <Moon size={18}/>}
        </Button>

        {token ? (
        <>
        <Button variant="ghost" onClick={()=> navigate('/dashboard')}>
          Dashboard
        </Button>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
        </>
        ):(
          <>
          <Button variant="ghost" onClick={()=> navigate("/login")}>
            Login
          </Button>
          <Button onClick={()=> navigate("/register")}>
            Get Started
          </Button>
          </>
        )}
      </div>
    </nav>
  )}
export default Navbar;