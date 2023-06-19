import { Text, StyleSheet, View , TouchableOpacity, TextInput } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { updateProfile } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../hooks/useUser';

const CreateProfile = () => {

    const { username, loggedInUser, photoURL, setUsername, setPhotoURL } = useUser();

    const navigation = useNavigation();
    // const [username, setUsername] = useState<string>('');
    // const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    // const [photoURL, setPhotoURL] = useState<string>('')

    // useEffect(() => {
    //     const unsubscribe = onAuthStateChanged(auth, userObj => {
    //         if (userObj) {
    //             setUsername(userObj.displayName || '');
    //             setPhotoURL(userObj.photoURL || '');
    //             setLoggedInUser(userObj);
    //         } else {
    //             navigation.navigate('Login')
    //         }
    //     });
    //     return unsubscribe;
    // }, []);


    const handleNext = () => {
        if (loggedInUser) {
            updateProfile(loggedInUser, {
                displayName: username,
                photoURL: photoURL,
            }).then(async () => {
                navigation.navigate('Home')
            }).catch((err) => {
                console.log('something went wrong', err)
            })
        } else {
            navigation.navigate('Login')
        }
    }


    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Complete Profile</Text>
            <View style={styles.sectionContainer}>
                <TouchableOpacity>
                    <View style={styles.profilePictureContainer}>
                        {
                            photoURL ?
                                <>this is a photo</> :
                                <FontAwesomeIcon icon={faCamera} />
                        }
                    </View>
                </TouchableOpacity>
                <View style={styles.userNameEmailContainer}>
                    <Text style={{ fontWeight: 'bold' }}>
                        {username || 'Display Name'}
                    </Text>
                    <Text>
                        {loggedInUser?.email}
                    </Text>
                </View>
            </View>
            <View style={styles.sectionContainer}>
                <TextInput
                    textContentType='name'
                    autoCapitalize="words"
                    placeholder="Display Name"
                    value={username}
                    onChangeText={(text: string) => setUsername(text)}
                    style={styles.displayNameInput}
                    clearButtonMode="always"
                />
            </View>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.buttonText}>
                    Next
                </Text>
            </TouchableOpacity>

        </SafeAreaView >
    )
}

export default CreateProfile

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        margin: 16,
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: 'center',
        marginBottom: 20
    },
    sectionContainer: {
        backgroundColor: "#2141",
        width: '100%',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        flexDirection: "row",
        alignItems: "center"
    },
    profilePictureContainer: {
        backgroundColor: 'grey',
        borderRadius: 100,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userNameEmailContainer: {
        alignItems: 'flex-start',
        paddingLeft: 20
    },
    displayNameInput: {
        fontWeight: 'bold',
        width: '100%'
    },
    nextButton: {
        backgroundColor: '#2f95dc',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: "white",
        fontWeight: '700',
        fontSize: 16,
    },
})