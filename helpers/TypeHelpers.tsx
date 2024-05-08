import { Timestamp } from "firebase/firestore";
import {
  DibbyParticipant,
  DibbySplitMethod,
  DibbyUser,
} from "../constants/DibbyTypes";
import { capitalizeName } from "./AppHelpers";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React from "react";
import {
  faCalculator,
  faEquals,
  faPercentage,
} from "@fortawesome/free-solid-svg-icons";

export const timestampToString = (date?: Timestamp): string => {
  return date
    ? new Timestamp(date.seconds, date.nanoseconds)
        .toDate()
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
    : "unknown";
};

export const getDibbySplitMethodIcon = (
  splitMethod: DibbySplitMethod,
  color: string,
  size = 36,
  opacity = 0.6
): JSX.Element => {
  switch (splitMethod) {
    case DibbySplitMethod.AMOUNT:
      return (
        <FontAwesomeIcon
          icon={faCalculator}
          size={size}
          color={color}
          style={{ opacity: 0.7 }}
        />
      );
    case DibbySplitMethod.EQUAL_PARTS:
      return (
        <FontAwesomeIcon
          icon={faEquals}
          size={size}
          color={color}
          style={{ opacity }}
        />
      );
    case DibbySplitMethod.PERCENTAGE:
      return (
        <FontAwesomeIcon
          icon={faPercentage}
          size={size}
          color={color}
          style={{ opacity }}
        />
      );
    default:
      return (
        <FontAwesomeIcon
          icon={faEquals}
          size={size}
          color={color}
          style={{ opacity }}
        />
      );
  }
};

export const getDibbySplitMethodString = (
  splitMethod: DibbySplitMethod
): string => {
  return capitalizeName(splitMethod.replace("_", " "));
};

export const dibbyUserToAvatarObject = (
  user: DibbyUser | DibbyParticipant
): {
  displayName: string | null;
  uid: string;
  username: string | null;
  photoURL: string | null;
  color: string;
} => {
  return {
    displayName:
      (user as DibbyUser).displayName || (user as DibbyParticipant).name,
    uid: user.uid,
    username: user.username,
    photoURL: user.photoURL,
    color: user.color,
  };
};
