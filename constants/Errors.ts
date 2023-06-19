const errorMessage = (code: string) => {
    const errors: any = {
        "auth/invalid-email": "Invalid email",
        "auth/user-not-found": "Email not found: please register",
        "auth/wrong-password": "Wrong Password",
    }


    return errors[code] || "Unknown Error";
}

export default errorMessage;