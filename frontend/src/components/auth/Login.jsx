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
import { setLoading, setUser } from "@/redux/authSlice";
import { Loader2 } from "lucide-react";

const Login = () => {
  const [forgot, setForgot] = useState(false);
  const [resetVerified, setResetVerified] = useState(false);
  const [verifiedUserId, setVerifiedUserId] = useState(null);
  const [input, setInput] = useState({
    email: "",
    password: "",
    role: "",
    recoveryQuestion: "Select",
    recoveryAnswer: "",
    newPassword: "",
  });

  const { loading, user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch(setLoading(true));

      if (forgot) {
        if (resetVerified) {
          // Step 2: Set new password after verification
          if (!input.newPassword) {
            toast.error("Please enter a new password");
            return;
          }

          const res = await axios.post(
            `${USER_API_END_POINT}/login`,
            {
              email: input.email,
              recoveryQuestion: input.recoveryQuestion,
              recoveryAnswer: input.recoveryAnswer,
              forgotPassword: true,
              role: input.role,
              newPassword: input.newPassword,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
              withCredentials: true,
            }
          );

          if (res.data.success) {
            dispatch(setUser(res.data.user));
            navigate("/");
            toast.success("Password reset successful!");
            setForgot(false);
            setResetVerified(false);
          }
        } else {
          // Step 1: Verify identity with recovery info
          console.log("ForgotState: ", forgot);
          console.log("Email:", input.email);
          console.log("Recovery Question:", input.recoveryQuestion);
          console.log("Recovery Answer:", input.recoveryAnswer);
          console.log("Is select?", input.recoveryQuestion === "Select");
          console.log("Role Value: ", input.role);

          if (
            !input.email ||
            !input.recoveryQuestion ||
            input.recoveryQuestion === "Select" ||
            !input.recoveryAnswer ||
            !input.role
          ) {
            toast.error("Please fill all the fields!");
            return;
          }

          const res = await axios.post(
            `${USER_API_END_POINT}/login`,
            {
              email: input.email,
              recoveryQuestion: input.recoveryQuestion,
              recoveryAnswer: input.recoveryAnswer,
              forgotPassword: true,
              role: input.role,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
              withCredentials: true,
            }
          );

          if (res.data.success && res.data.verified) {
            setVerifiedUserId(res.data.userId);
            setResetVerified(true);
            toast.success("Identity verified! Please set your new password.");
          }
        }
      } else {
        // Normal login request
        if (!input.email || !input.password || !input.role) {
          toast.error("Please fill all required fields");
          return;
        }

        const res = await axios.post(
          `${USER_API_END_POINT}/login`,
          {
            email: input.email,
            password: input.password,
            role: input.role,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );

        if (res.data.success) {
          dispatch(setUser(res.data.user));
          navigate("/");
          toast.success(res.data.message);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Reset form when switching between login and forgot password
  const toggleForgotPassword = () => {
    setForgot(!forgot);
    setResetVerified(false);
    setInput({
      ...input,
      password: "",
      newPassword: "",
      recoveryAnswer: "",
      recoveryQuestion: "Select",
    });
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
          <h2 className="text-2xl font-bold mb-6 text-center">
            {forgot
              ? resetVerified
                ? "Reset Your Password"
                : "Account Recovery"
              : "Login to Your Account"}
          </h2>

          <div className="flex items-center justify-between">
            {!forgot && (
              <RadioGroup className="flex items-center gap-4 my-5">
                <div className="flex items-center space-x-2">
                  <Input
                    type="radio"
                    name="role"
                    id="student"
                    value="student"
                    checked={input.role === "student"}
                    onChange={changeEventHandler}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="student">Student</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="radio"
                    name="role"
                    id="recruiter"
                    value="recruiter"
                    checked={input.role === "recruiter"}
                    onChange={changeEventHandler}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="recruiter">Recruiter</Label>
                </div>
              </RadioGroup>
            )}
            <p
              className="text-blue-700 opacity-80 cursor-pointer"
              onClick={toggleForgotPassword}
            >
              {forgot ? "Back to Login" : "Forgot password"}
            </p>
          </div>

          {forgot ? (
            resetVerified ? (
              // Step 2: Password reset form
              <>
                <div className="my-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    type="password"
                    id="newPassword"
                    value={input.newPassword}
                    name="newPassword"
                    onChange={changeEventHandler}
                    placeholder="Enter new password"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Your identity has been verified. Please set a new password.
                  </p>
                </div>
              </>
            ) : (
              // Step 1: Recovery verification form
              <>
                <RadioGroup className="flex items-center gap-4 my-5">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="radio"
                      name="role"
                      id="student-recovery"
                      value="student"
                      checked={input.role === "student"}
                      onChange={changeEventHandler}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="student-recovery">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="radio"
                      name="role"
                      id="recruiter-recovery"
                      value="recruiter"
                      checked={input.role === "recruiter"}
                      onChange={changeEventHandler}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="recruiter-recovery">Recruiter</Label>
                  </div>
                </RadioGroup>
                <div className="my-2">
                  <Label htmlFor="recovery-email">Email</Label>
                  <Input
                    type="email"
                    id="recovery-email"
                    value={input.email}
                    name="email"
                    onChange={changeEventHandler}
                    placeholder="joedavid@email.com"
                  />
                </div>
                <div className="my-2">
                  <Label htmlFor="recoveryQuestion">Recovery Question</Label>
                  <br />
                  <select
                    id="recoveryQuestion"
                    name="recoveryQuestion"
                    className="w-full h-10 px-2.5 border rounded-md text-gray-500"
                    onChange={changeEventHandler}
                    value={input.recoveryQuestion}
                  >
                    <option disabled value="Select" className="text-gray-500">
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
                  <Label htmlFor="recoveryAnswer">Your Answer</Label>
                  <Input
                    type="text"
                    id="recoveryAnswer"
                    value={input.recoveryAnswer}
                    name="recoveryAnswer"
                    onChange={changeEventHandler}
                    placeholder="Your Answer"
                  />
                </div>
              </>
            )
          ) : (
            // Normal login form
            <>
              <div className="my-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  type="email"
                  id="login-email"
                  value={input.email}
                  name="email"
                  onChange={changeEventHandler}
                  placeholder="joedavid@email.com"
                />
              </div>
              <div className="my-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  type="password"
                  id="login-password"
                  value={input.password}
                  name="password"
                  onChange={changeEventHandler}
                  placeholder="password"
                />
              </div>
            </>
          )}

          {loading ? (
            <Button disabled className="w-full my-4">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
            </Button>
          ) : (
            <Button type="submit" className="w-full my-4">
              {forgot
                ? resetVerified
                  ? "Reset Password"
                  : "Verify Identity"
                : "Login"}
            </Button>
          )}

          <div className="text-sm text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Signup
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
