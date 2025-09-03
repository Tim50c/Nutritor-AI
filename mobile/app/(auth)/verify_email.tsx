import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../../config/firebase';

import CustomButtonAuth from '../../components/CustomButtonAuth';

export default function VerifyEmailHandler() {
    const router = useRouter();
    const { oobCode } = useLocalSearchParams();
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
                        <Text style={{ color: '#1F2937', fontSize: 20, marginTop: 20, textAlign: 'center', fontWeight: '600' }}>
                            Verifying your email...
                        </Text>
                    </>
                );
            case 'success':
                return (
                    <>
                        <Text style={{ color: '#1F2937', fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
                            Email Verified!
                        </Text>
                        <Text style={{ color: '#6B7280', fontSize: 18, marginTop: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 }}>
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
                        <Text style={{ color: '#DC2626', fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
                            Verification Failed
                        </Text>
                        <Text style={{ color: '#6B7280', fontSize: 18, marginTop: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 }}>
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
        <SafeAreaView style={{ backgroundColor: '#FFFFFF', flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            {renderContent()}
        </SafeAreaView>
    );
}