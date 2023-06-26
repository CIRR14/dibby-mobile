import React, { useEffect } from 'react'
import { StyleSheet, SafeAreaView, View, useColorScheme, Text, TouchableOpacity, TextInput, ColorSchemeName, TouchableWithoutFeedback, Keyboard, ScrollView, KeyboardAvoidingView } from 'react-native'
import { ColorTheme, ThemeColors } from '../constants/Colors'
import { useNavigation, useTheme } from '@react-navigation/native'
import { User } from 'firebase/auth'
import { db } from '../firebase'
import { faAdd, faClose, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { Expense, Traveler, Trip, TripDoc } from '../constants/DibbyTypes'
import { Timestamp, addDoc, collection } from 'firebase/firestore'
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { generateColor } from '../helpers/GenerateColor'

interface ICreateTripProps {
    currentUser: User;
    onPressBack: () => void;
}


const CreateTrip: React.FC<ICreateTripProps> = ({ currentUser, onPressBack }) => {
    const { colors } = useTheme() as unknown as ColorTheme;
    const theme = useColorScheme();
    const styles = makeStyles(colors as unknown as ThemeColors, theme);
    const navigation = useNavigation();

    // const [title, setTitle] = useState("");


    const initialValues: TripDoc = {
        created: Timestamp.fromDate(new Date()),
        updated: Timestamp.fromDate(new Date()),
        name: "",
        travelers: [] as Traveler[],
        expenses: [] as Expense[],
        completed: false,
        amount: 0,
        perPerson: 0,
    };

    const { register, handleSubmit, formState, control, getValues, setValue, reset } = useForm({
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: initialValues,
    });

    const { fields, append, remove } = useFieldArray({
        name: "travelers",
        control,
    });

    const addTraveler = () => {
        append({
            id: fields[fields.length - 1].id,
            name: "",
            paid: false,
            amountPaid: 0,
            owed: 0,
            color: generateColor(),
        });
    };


    useEffect(() => {
        if (fields.length === 0) {
            append({
                id: currentUser.uid,
                name: currentUser.displayName || 'Me',
                paid: false,
                amountPaid: 0,
                owed: 0,
                color: generateColor(),
            });
        }
    }, [fields, append]);

    const removeTraveler = (index: number) => {
        remove(index);
    };

    const onSubmit = async (data: TripDoc) => {
        try {
            const docRef = await addDoc(collection(db, currentUser.uid), data);
            console.log("Document written with ID: ", docRef.id);
            reset();
            onPressBack();
        } catch (e) {
            reset();
            console.error("Error adding document: ", e);
        }
    };

    const showError = (_fieldName: string, index?: any, secondName?: any) => {
        const travelerError = (formState.errors as any)[_fieldName]?.[index]?.[secondName];
        return (
            travelerError && (
                <div
                    style={{
                        color: "red",
                        padding: 5,
                        paddingLeft: 12,
                        fontSize: "smaller",
                    }}
                >
                    This field is required
                </div>
            )
        );
    };


    return (
        <SafeAreaView style={styles.topContainer}>
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} >
                <View>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={onPressBack}
                        >
                            <FontAwesomeIcon
                                icon={faClose}
                                size={24}
                                color={colors.secondary}
                            />
                        </TouchableOpacity>
                        <Text style={styles.title}>
                            Add Trip
                        </Text>
                        <View>
                        </View>
                    </View>
                    <View style={styles.content}>
                        <Controller
                            control={control}
                            name="name"
                            rules={{
                                required: true,
                            }}

                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    placeholder="Name of Trip"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    clearButtonMode="always"
                                    style={styles.input}
                                    placeholderTextColor={
                                        theme === "dark" ? colors.scrim : colors.onSurfaceDisabled
                                    }
                                />
                            )}
                        />
                        {formState.errors.name && <Text style={styles.errorText}>Trip must have a name.</Text>}
                        {/* <TextInput
                            placeholder="Name of Trip"
                            value={title}
                            placeholderTextColor={
                                theme === "dark" ? colors.scrim : colors.onSurfaceDisabled
                            }
                            onChangeText={(text: string) => setTitle(text)}
                            style={styles.input}
                            clearButtonMode="always"
                        /> */}
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>
                                Travelers
                            </Text>
                        </View>

                        <KeyboardAvoidingView style={styles.travelersContainer} behavior='padding' enabled keyboardVerticalOffset={150}>
                            <ScrollView>
                                {
                                    fields.map(({ name, id }: any, index: number) => {
                                        return (
                                            <View style={styles.travelerContainer} key={id}>
                                                <Controller
                                                    control={control}
                                                    rules={{ required: true }}
                                                    name={`travelers.${index}.name`}
                                                    render={({ field: { onChange, onBlur, value } }) =>
                                                        <TextInput
                                                            placeholder={index === 0 ? currentUser.displayName!! : `Name of Traveler ${index + 1}`}
                                                            placeholderTextColor={
                                                                theme === "dark" ? colors.scrim : colors.onSurfaceDisabled
                                                            }
                                                            onBlur={onBlur}
                                                            onChangeText={onChange}
                                                            value={value}
                                                            editable={index !== 0}
                                                            style={styles.input}
                                                            clearButtonMode="always"
                                                            returnKeyType='next'
                                                            onSubmitEditing={addTraveler}
                                                        />}
                                                />
                                                {
                                                    index !== 0 &&
                                                    <TouchableOpacity style={styles.deleteButton} onPress={() => removeTraveler(index)}>
                                                        <FontAwesomeIcon icon={faTrash} size={16} color={colors.error} />
                                                    </TouchableOpacity>
                                                }

                                            </View>

                                        )
                                    })
                                }
                                {formState.errors.travelers && <Text style={styles.errorText}> All travelers must have a name.</Text>}
                                <View style={styles.addContainer}>
                                    <TouchableOpacity style={styles.addButton} onPress={addTraveler}>
                                        <FontAwesomeIcon style={{ margin: 8 }} icon={faAdd} size={16} color={'white'} />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity style={!formState.isValid ? [styles.submitButton, styles.disabledButton] : styles.submitButton} disabled={!formState.isValid} onPress={handleSubmit(onSubmit)}>
                                    <Text style={styles.buttonText}>
                                        Add Trip
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )
}

export default CreateTrip

const makeStyles = (colors: ThemeColors, theme?: ColorSchemeName) =>
    StyleSheet.create({
        topContainer: {
            backgroundColor: colors.background,
            height: '100%',
        },
        travelersContainer: {
            flexDirection: 'column',
            justifyContent: 'center'
        },
        travelerContainer: {
            display: 'flex',
            flexDirection: 'row',
        },
        deleteButton: {
            justifyContent: 'center',
            margin: 'auto',
            padding: 12,
        },
        header: {
            display: "flex",
            margin: 16,
            justifyContent: 'space-between',
            flexDirection: 'row',
        },
        titleContainer: {
            display: 'flex',
            alignItems: 'center',
            marginTop: 16
        },
        title: {
            color: colors.secondary,
            fontSize: 22,
            width: 120,

        },
        text: {
            color: colors.onBackground,
        },
        errorText: {
            color: colors.error,
        },
        content: {
            backgroundColor: colors.background,
            margin: 16,
            display: 'flex',
        },
        input: {
            backgroundColor:
                theme === "dark" ? colors.inverseSurface : colors.surfaceVariant,
            color: theme === "dark" ? colors.surface : colors.onSurfaceVariant,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginTop: 8,
            minWidth: '90%'
        },
        submitButton: {
            backgroundColor: colors.primary,
            width: "100%",
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 32,
        },
        disabledButton: {
            opacity: 0.5
        },
        addContainer: {
            display: 'flex',
            alignItems: 'center',
            marginTop: 16,
        },
        addButton: {
            backgroundColor: colors.tertiary,
            borderRadius: 100,
        },
        buttonText: {
            color: colors.onPrimary,
            fontWeight: "700",
            fontSize: 16,
        },
    });