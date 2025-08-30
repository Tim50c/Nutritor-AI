import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../../config/firebase';

import CustomButtonAuth from '../../components/CustomButtonAuth';

export default function VerifyEmailHandler() {
    const router = useRouter();
    const { oobCode } = useLocalSearchParams(); // oobCode comes from the verification link
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleVerification = async () => {
            if (!oobCode || typeof oobCode !== 'string') {
                setErrorMessage('Invalid verification link.');
                setStatus('error');
                return;
            }
            try {
                await applyActionCode(auth, oobCode);
                setStatus('success');
            } catch (error: any) {
                setErrorMessage(error.message);
                setStatus('error');
            }
        };

        handleVerification();
    }, [oobCode]);

    const renderContent = () => {
        switch (status) {
            case 'verifying':
                return (
                    <>
                        <ActivityIndicator size="large" color="#F97316" />
                        <Text style={{ color: 'white', fontSize: 18, marginTop: 20 }}>
                            Verifying your email...
                        </Text>
                    </>
                );
            case 'success':
                return (
                    <>
                        <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}>
                            Email Verified!
                        </Text>
                        <Text style={{ color: '#A0A0A0', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
                            Your account has been successfully verified.
                        </Text>
                        <View style={{width: '100%', marginTop: 40}}>
                           <CustomButtonAuth title="Proceed to Log In" onPress={() => router.replace('./sign_in')} />
                        </View>
                    </>
                );
            case 'error':
                return (
                    <>
                        <Text style={{ color: '#C93838', fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}>
                            Verification Failed
                        </Text>
                        <Text style={{ color: '#A0A0A0', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
                            {errorMessage}
                        </Text>
                        <View style={{width: '100%', marginTop: 40}}>
                           <CustomButtonAuth title="Back to Sign In" onPress={() => router.replace('./sign_in')} />
                        </View>
                    </>
                );
        }
    };

    return (
        <SafeAreaView style={{ backgroundColor: '#121212', flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            {renderContent()}
        </SafeAreaView>
    );
}