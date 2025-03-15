import { Alert } from "react-native";

    
    
    export const validOdds = (odds: string) => {
        // Check if the input is a number and if it is within a valid range
        if (isNaN(Number(odds)) || (Number(odds) > -100 && Number(odds) < 100)) {
          Alert.alert("Invalid Odds", "Odds must be a number less than or equal to -100 or greater than or equal to +100.");
          return false; // Invalid input
        }
        return true; // Valid input
      }

      export const validOverUnder = (overUnder: string) => {

          if(isNaN(Number(overUnder))){
            Alert.alert("Invalid Over / Under", "The Over / Under must be a number.");
            return false; //Invalid
          }

          return true; //Valid
      }

      export const validSpread = (spread: string, moneyline1, moneyline2) => {

        if(isNaN(Number(spread)) || Number(spread) < 0){
          Alert.alert("Invalid Spread", "Spread must be a positive number.");
          return false; //Invalid
          
        }else if(moneyline1 == moneyline2){
          Alert.alert("Invalid Spread", "Moneyline odds must be different to have a spread.");
          return false; // Invalid
        }

        return true; //Valid
    }

    export const validInt = (num) => {

        if(!(Number.isInteger(Number(num)) && Number(num) > 0))
        {
            Alert.alert("Invalid Input", "Ensure all data is inputted correctly.");
            return false; 

        } else {

            return true;
        }
        


      }