import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity,TextInput,Image,KeyboardAvoidingView,ToastAndroid, Alert } from 'react-native';
import * as Permissions from 'expo-permissions'
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase'
import db from '../config'

export default class TransactionScreen extends React.Component{
    constructor(){
        super()
        this.state={
            hasCameraPermissions:null,
            scanned:false,
            scannedBookId:'',
            scannedStudentId:'',
            buttonState:'normal',
            transactionMessage:''

        }
    }
    getCameraPermissions=async(id)=>{
        const {status} = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({
            hasCameraPermissions:status==="granted",
            buttonState:id,
            scanned:false
        })
    }
    handleBarCodeScanned =async ({ type, data }) => {
        this.setState({
            scanned:true,
            buttonState:'normal',
            scannedData:data,

        })
    }
    initiateBookIssue=async()=>{
        db.collection("transaction").add({
            studentId:this.state.scannedStudentId,
             bookId:this.state.scannedBookId,
            date:firebase.firestore.Timestamp.now().toDate(),
        transactionType:"issue"   })
        db.collection("books").doc(this.state.scannedBookId).update({
            bookAvailability:false
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
           numberOfBookIssued:firebase.firestore.FieldedValue.increament(1)
        })
        Alert.alert("book issued.")
        this.setState({
            scannedStudentId:'',
            scannedBookId:''
        })
    }
    initiateBookReturn=async()=>{
        db.collection("transaction").add({
            studentId:this.state.scannedStudentId,
             bookId:this.state.scannedBookId,
            date:firebase.firestore.Timestamp.now().toDate(),
        transactionType:"return"   })
        db.collection("books").doc(this.state.scannedBookId).update({
            bookAvailability:true
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
           numberOfBookIssued:firebase.firestore.FieldedValue.increament(-1)
        })
        Alert.alert("Book returned.")
        this.setState({
            scannedStudentId:'',
            scannedBookId:''
        })
    }
    checkBookEligibility=async()=>{
        const bookRef=await db.collection("books").where("bookId","==",this.scannedBookId).get()
        var transactionType=""
        if (bookRef.docs.length==0) {
            transactionType='false'
        }
        else{
            bookRef.docs.map(()=>{
                var book=doc.data()
            if (book.bookAvailability) {
                transactionType="Issue"
            } else {transactionType="Return"
                
            }    
            })
        }
        return transactionType
    }
    checkStudentEligibilityForBookIssue=async()=>{
        const studentRef=await db.collection("students").where("studentId","==",this.scannedstudentId).get()
        var  isStudentEligible=""
        if (studentRef.docs.length==0) {
            this.setState({
                scannedStudentId:'',
                scannedBookId:''
            })
            isStudentEligible=false
            Alert.alert("The Student does not exist in the school library.")
        }
        else{
            studentRef.docs.map((doc)=>{
                var student=doc.data()
            if (student.numberOfBookIssued<2) {
                isStudentEligible=true
            } else {isStudentEligible=false
                Alert.alert("The Student has already issued two books.")
                this.setState({
                    scannedStudentId:'',
                    scannedBookId:''
                })
            }    
            })
        }
        return isStudentEligible
    }
    checkStudentEligibilityForBookReturn=async()=>{
        const transactionRef=await db.collection("transactios").where("bookId","==",this.scannedbookId).limit(1).get()
        var  isStudentEligible=""
        transactionRef.docs.map((doc)=>{
            var lastBookTransaction=doc.data
            if (lastBookTransaction.studentId=this.state.scannedStudentId) {
                isStudentEligible=true
            } else {
                isStudentEligible=false
                Alert.alert("The book wasn't issued by this student.")
                this.setState({
                    scannedStudentId:'',
                    scannedBookId:''
                })
            }
            
        })
        return isStudentEligible
    }
    handleTransaction=async()=>{
        var transactionType=await this.checkBookEligibility()
        if (!transactionType) {
            Alert.alert("The Book does not exist in the school library.")
            this.setState({
                scannedStudentId:'',
                scannedBookId:''
            })
        }
        else if(transactionType==="Issue"){
            var isStudentEligible=await this.checkStudentEligibilityForBookIssue()
            if (isStudentEligible) {
                    this.initiateBookIssue()
                    Alert.alert("Book issued")
                } 
        }
        else {
            var isStudentEligible=await this.checkStudentEligibilityForBookReturn()
            if (isStudentEligible) {
                    this.initiateBookReturn()
                    Alert.alert("Book retuned")
                } 
        }
    }
    render(){
        const hasCameraPermissions=this.state.hasCameraPermissions
        const scanned=this.state.scanned
        const buttonState=this.state.buttonState
        if (buttonState!=="normal"&& hasCameraPermissions) {
            return(
                <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
              />
            )
        } else if (buttonState==="normal") {
            return(
                <KeyboardAvoidingView style={styles.container} behavior="padding" enable>
                    <View>
                        <Image source={require("../assets/bookLogo.jpg")} style={{width:200,height:200}}/>
                        <Text style={{textAlign:"center",fontSize:30}}>
                            Wily
                        </Text>
                    </View>
                   <View style= {styles.inputView}>
                    <TextInput style={styles.inputBox} placeholder="book Id"
                    onChangeText={text=>this.setState({scannedBookId:text})}
                    value={this.state.scannedBookId}/>
                    <TouchableOpacity style={styles.scanButton}
                    onPress={()=>{
                        this.getCameraPermissions("BookId")
                    }
                    }>
                        <Text style= {styles.buttonText}>
                            Scan
                        </Text>
                    </TouchableOpacity>
                    </View> 
                    <View style= {styles.inputView}>
                    <TextInput style={styles.inputBox} placeholder="Student Id"
                    onChangeText={text=>this.setState({scannedStudentId:text})}
                    value={this.state.scannedStudentId}/>
                    <TouchableOpacity style={styles.scanButton}
                    onPress={()=>{
                        this.getCameraPermissions("StudentId")
                    }
                    }>
                        <Text style= {styles.buttonText}>
                            Scan
                        </Text>
                    </TouchableOpacity>
                    </View> 
                    <TouchableOpacity style={styles.submitButton}
                    onPress={async()=>{var transactionMesaage=this.handleTransaction()
                    this.setState({scannedBookId:'',scannedStudentId:''})}}>
                        <Text style={styles.submitButtonText}>
                            SUBMIT
                        </Text>
                    </TouchableOpacity>
                    </KeyboardAvoidingView>
            )
        }
        
    }
}

const styles=StyleSheet.create({
    container:{
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    },
    displayText:{
        fontSize:15,
        textDecorationLine:'underline'
    },
    scanButton:{
        margin:10,
        padding:10,
        backgroundColor:'lightblue',
        
    },
    buttonText:{
        fontSize:20,
        textAlign:'center',
        marginTop:10
    },
    inputView:{
        flexDirection:'row',
        margin:20
    },
    inputBox:{
        width:200,
        height:40,
        borderWidth:1.5,
        borderRightWidth:0,
        fontSize:20
    }, 
    scanButton:{
        backgroundColor:'lightblue',
        width:50,
        borderWidth:1.5,
        borderLeftWidth:0
    },
    submitButton:{
        backgroundColor:'skyblue',
        width:100,
        height:50,
    },
    submitButtonText:{
        padding:10,
        textAlign:'center',
        fontSize:20,
        fontWeight:'bold',
        color:'black'
    }
})