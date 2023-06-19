import { User, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigation } from "@react-navigation/native";

export const useUser = () => {
    const navigation = useNavigation();
    const [username, setUsername] = useState<string>('');
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [photoURL, setPhotoURL] = useState<string>('')
    
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, userObj => {
            if (userObj) {
                setUsername(userObj.displayName || '');
                setPhotoURL(userObj.photoURL || '');
                setLoggedInUser(userObj);
            } else {
                navigation.navigate('Login')
            }
        });
        return unsubscribe;
    }, []);
    
    return { username, loggedInUser, photoURL, setUsername, setPhotoURL }
}