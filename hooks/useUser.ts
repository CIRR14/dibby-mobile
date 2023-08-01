import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { useNavigation } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import { DibbyUser } from "../constants/DibbyTypes";

export const useUser = () => {
    const navigation = useNavigation();

    const [dibbyUser, setDibbyUser] = useState<DibbyUser | undefined>(undefined)
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, userObj => {
            if (userObj) {
                setLoggedInUser(userObj);
                if (!userObj.emailVerified) {
                    navigation.navigate('VerifyEmail')
                }
            } else {
                signOut(auth);
                navigation.navigate('Login')
            }
        });
        return unsubscribe;
    }, []);




    useEffect(() => {
        if (loggedInUser) {
                const unsubscribe = onSnapshot(doc(db, 'users', loggedInUser.uid), (doc) => {
                    if (doc.exists()) {
                        const user: DibbyUser = (doc.data() as DibbyUser);
                        setDibbyUser(user);
                        if (!user.displayName || !user.email || !user.username) {
                            navigation.navigate('CreateProfile')
                        } 
                    } else {
                        signOut(auth);
                    }
                })
                return unsubscribe;
            }
        } , [loggedInUser])
    
    return { dibbyUser, loggedInUser }
}
