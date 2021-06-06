import firebase from 'firebase'
require('@firebase/firestore')
var firebaseConfig = {
    apiKey: "AIzaSyDFJJ7rBGR_C5nQSybR3ihX9DvidjSokYo",
    authDomain: "wily-c069c.firebaseapp.com",
    projectId: "wily-c069c",
    storageBucket: "wily-c069c.appspot.com",
    messagingSenderId: "981553919409",
    appId: "1:981553919409:web:e6246e3f28c2a54aef7990"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  export default firebase.firestore()