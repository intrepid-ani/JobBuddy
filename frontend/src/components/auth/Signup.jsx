import React, { useEffect, useState } from "react";
import Navbar from "../shared/Navbar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { RadioGroup } from "../ui/radio-group";
import { Button } from "../ui/button";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "@/redux/authSlice";
import { Loader2 } from "lucide-react";
import { data } from "autoprefixer";

const Signup = () => {
  const [input, setInput] = useState({
    fullname: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "",
    file: "",
    recoveryQuestion: "select",
    recoveryAnswer: "",
  });
  const { loading, user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };
  const changeFileHandler = (e) => {
    setInput({ ...input, file: e.target.files?.[0] });
  };
  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData(); //formdata object
    formData.append("fullname", input.fullname);
    formData.append("email", input.email);
    formData.append("phoneNumber", input.phoneNumber);
    formData.append("password", input.password);
    formData.append("role", input.role);
    formData.append("recoveryQuestion", input.recoveryQuestion);
    formData.append("recoveryAnswer", input.recoveryAnswer);
    if (input.file) {
      formData.append("file", input.file);
    }

    try {
      // Add this before making the axios request in submitHandler
      if (
        !input.fullname ||
        !input.email ||
        !input.password ||
        !input.role ||
        input.recoveryQuestion === "select" ||
        !input.recoveryAnswer
      ) {
        toast.error("Please fill all required fields");
        return;
      }

      console.log("Step 1: Form data prepared:");

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      dispatch(setLoading(true));
      console.log("Step 2: Response received:");
      const res = await axios.post(`${USER_API_END_POINT}/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      console.log("Step 3: Response received:", res.data);

      // Handle successful response
      if (res.data && res.data.success) {
        toast.success(res.data.message || "Registration successful!");
        navigate("/login"); // Redirect to login page
      }
    } catch (error) {
      console.log(error);
      // Now handle the error properly
      if (error.response && error.response.data) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Network Error or Server not responding");
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center max-w-7xl mx-auto">
        <form
          onSubmit={submitHandler}
          className="w-1/2 border border-gray-200 rounded-md p-4 my-10"
        >
          <h1 className="font-bold text-xl mb-5">Sign Up</h1>
          <div className="my-2">
            <Label>Full Name</Label>
            <Input
              type="text"
              value={input.fullname}
              name="fullname"
              onChange={changeEventHandler}
              placeholder="Joe David"
            />
          </div>
          <div className="my-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={input.email}
              name="email"
              onChange={changeEventHandler}
              placeholder="joedavid@email.com"
            />
          </div>
          <div className="my-2">
            <Label>Phone Number</Label>
            <Input
              type="text"
              value={input.phoneNumber}
              name="phoneNumber"
              onChange={changeEventHandler}
              placeholder="Contact Number"
            />
          </div>
          <div className="my-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={input.password}
              name="password"
              onChange={changeEventHandler}
              placeholder="password"
            />
          </div>
          <div className="my-2">
            <Label htmlFor="selQuestion">Recovery Question</Label>
            <br />
            <select
              id="recoveryQuestion"
              name="recoveryQuestion"
              className="w-full h-10 px-2.5 border rounded-md text-gray-500"
              onChange={changeEventHandler}
              value={input.recoveryQuestion}
            >
              <option
                disabled
                selected
                className="text-gray-500"
                value="select"
              >
                Select
              </option>
              <option value="What's your pet name?">
                What's your pet name?
              </option>
              <option value="What was your chilhood nickname?">
                What was your chilhood nickname?
              </option>
              <option value="Which city you born in?">
                Which city you born in?
              </option>
            </select>
          </div>
          <div className="my-2">
            <Label>Your Answer</Label>
            <Input
              type="text"
              value={input.recoveryAnswer}
              name="recoveryAnswer"
              onChange={changeEventHandler}
              placeholder={"Your Answer"}
            />
          </div>
          <div className="flex items-center justify-between">
            <RadioGroup className="flex items-center gap-4 my-5">
              <div className="flex items-center space-x-2">
                <Input
                  type="radio"
                  name="role"
                  value="student"
                  checked={input.role === "student"}
                  onChange={changeEventHandler}
                  className="cursor-pointer"
                />
                <Label htmlFor="r1">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="radio"
                  name="role"
                  value="recruiter"
                  checked={input.role === "recruiter"}
                  onChange={changeEventHandler}
                  className="cursor-pointer"
                />
                <Label htmlFor="r2">Recruiter</Label>
              </div>
            </RadioGroup>
            <div className="flex items-center gap-2">
              <Label>Profile</Label>
              <Input
                accept="image/*"
                type="file"
                onChange={changeFileHandler}
                className="cursor-pointer"
              />
            </div>
          </div>
          {loading ? (
            <Button className="w-full my-4">
              {" "}
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait{" "}
            </Button>
          ) : (
            <Button type="submit" className="w-full my-4">
              Signup
            </Button>
          )}
          <span className="text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600">
              Login
            </Link>
          </span>
        </form>
      </div>
    </div>
  );
};

export default Signup;
