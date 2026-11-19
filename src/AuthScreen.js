import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

const C = {
  bg: '#09090B',
  card: '#242428',
  white: '#F5F5F5',
  grey: '#92929A',
  crimson: '#702D3B',
  line: '#39393F',
};

function Field({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = 'none',
}) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={C.grey}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      style={styles.input}
    />
  );
}

// Read parameters from a URL query string or hash.
function readUrlParams(value) {
  const result = {};

  if (!value) return result;

  value.split('&').forEach((part) => {
    const separator = part.indexOf('=');

    if (separator === -1) return;

    const key = part.slice(0, separator);
    const val = part.slice(separator + 1);

    try {
      result[decodeURIComponent(key)] =
        decodeURIComponent(val.replace(/\+/g, ' '));
    } catch {
      result[key] = val;
    }
  });

  return result;
}

export default function AuthScreen({ onSignedIn }) {
  const [screen, setScreen] = useState('welcome');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // Handle password-reset links that open Folio.
  useEffect(() => {
    let isMounted = true;

    async function handleRecoveryLink(url) {
      if (!url) return;

      try {
        const questionMark = url.indexOf('?');
        const hashMark = url.indexOf('#');

        const queryString =
          questionMark !== -1
            ? url.slice(
                questionMark + 1,
                hashMark !== -1 ? hashMark : undefined
              )
            : '';

        const hashString =
          hashMark !== -1
            ? url.slice(hashMark + 1)
            : '';

        const queryParams = readUrlParams(queryString);
        const hashParams = readUrlParams(hashString);

        // Supabase PKCE recovery links use a code.
        if (queryParams.code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(
              queryParams.code
            );

          if (error) throw error;

          if (isMounted) {
            setPassword('');
            setConfirmPassword('');
            setScreen('updatePassword');
          }

          return;
        }

        // Other Supabase recovery links contain session tokens.
        const accessToken =
          hashParams.access_token || queryParams.access_token;

        const refreshToken =
          hashParams.refresh_token || queryParams.refresh_token;

        const recoveryType =
          hashParams.type || queryParams.type;

        if (
          accessToken &&
          refreshToken &&
          recoveryType === 'recovery'
        ) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          if (isMounted) {
            setPassword('');
            setConfirmPassword('');
            setScreen('updatePassword');
          }
        }
      } catch (error) {
        if (isMounted) {
          Alert.alert(
            'Reset link problem',
            'This password-reset link could not be opened. Please request a new one.'
          );
        }
      }
    }

    const subscription = Linking.addEventListener(
      'url',
      ({ url }) => {
        handleRecoveryLink(url);
      }
    );

    Linking.getInitialURL().then(handleRecoveryLink).catch(() => {});

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  async function signUp() {
    const cleanUsername = username.trim();

    if (!/^[A-Za-z0-9_]{3,20}$/.test(cleanUsername)) {
      Alert.alert(
        'Check your username',
        'Use 3–20 letters, numbers or underscores. No @ symbol.'
      );
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert(
        'Check your email',
        'Please enter a valid email address.'
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        'Password too short',
        'Your password must be at least 8 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'Please check both password fields.'
      );
      return;
    }

    setBusy(true);

    try {
      const { data: existing, error: lookupError } =
        await supabase
          .from('profiles')
          .select('id')
          .ilike('username', cleanUsername)
          .limit(1);

      if (lookupError) throw lookupError;

      if (existing?.length) {
        Alert.alert(
          'Username taken',
          'Please choose another username.'
        );
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            username: cleanUsername,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        onSignedIn?.();
      } else {
        Alert.alert(
          'Check your email',
          'We have sent you a confirmation link. Please confirm your email before logging in.'
        );
        setScreen('login');
      }
    } catch (error) {
      Alert.alert('Sign-up unsuccessful', error.message);
    } finally {
      setBusy(false);
    }
  }

  async function logIn() {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing details',
        'Please enter your email and password.'
      );
      return;
    }

    setBusy(true);

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (error) throw error;

      onSignedIn?.();
    } catch (error) {
      Alert.alert('Login unsuccessful', error.message);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert(
        'Check your email',
        'Please enter the email address associated with your Folio account.'
      );
      return;
    }

    setBusy(true);

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo: 'folioapp://reset-password',
          }
        );

      if (error) throw error;

      Alert.alert(
        'Check your inbox',
        'If an account exists for this email address, Supabase will send you a password-reset email. Follow the link in that email to continue.'
      );

      setScreen('login');
    } catch (error) {
      Alert.alert(
        'Password reset unsuccessful',
        error.message
      );
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword() {
    if (password.length < 8) {
      Alert.alert(
        'Password too short',
        'Your new password must be at least 8 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'Please check both password fields.'
      );
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      Alert.alert(
        'Password updated',
        'Your password has been changed successfully. You can now log in with your new password.'
      );

      setPassword('');
      setConfirmPassword('');

      await supabase.auth.signOut();

      setScreen('login');
    } catch (error) {
      Alert.alert(
        'Password update unsuccessful',
        error.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>folio</Text>

        <Text style={styles.tagline}>
          A home for the books you love.
        </Text>

        {screen === 'welcome' ? (
          <View style={styles.panel}>
            <Text style={styles.heading}>
              Your collection, your way.
            </Text>

            <Text style={styles.description}>
              Keep your books, editions and special collections beautifully organised.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setScreen('signup')}
            >
              <Text style={styles.primaryText}>
                Create account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setScreen('login')}
            >
              <Text style={styles.secondaryText}>
                Log in
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.heading}>
              {screen === 'signup'
                ? 'Create your account'
                : screen === 'forgot'
                  ? 'Reset your password'
                  : screen === 'updatePassword'
                    ? 'Choose a new password'
                    : 'Welcome back'}
            </Text>

            {screen === 'forgot' && (
              <Text style={styles.description}>
                Enter the email address linked to your Folio account. We'll send you a password-reset email.
              </Text>
            )}

            {screen === 'updatePassword' && (
              <Text style={styles.description}>
                Choose a new password for your Folio account.
              </Text>
            )}

            {screen === 'signup' && (
              <Field
                placeholder="Username (no @ symbol)"
                value={username}
                onChangeText={setUsername}
              />
            )}

            {screen !== 'updatePassword' && (
              <Field
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
              />
            )}

            {screen !== 'forgot' && (
              <Field
                placeholder={
                  screen === 'updatePassword'
                    ? 'New password (at least 8 characters)'
                    : 'Password (at least 8 characters)'
                }
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            )}

            {(screen === 'signup' ||
              screen === 'updatePassword') && (
              <Field
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            )}

            {screen === 'login' && (
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => setScreen('forgot')}
              >
                <Text style={styles.forgotText}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                busy && { opacity: 0.6 },
              ]}
              disabled={busy}
              onPress={
                screen === 'signup'
                  ? signUp
                  : screen === 'forgot'
                    ? resetPassword
                    : screen === 'updatePassword'
                      ? updatePassword
                      : logIn
              }
            >
              <Text style={styles.primaryText}>
                {busy
                  ? 'Please wait…'
                  : screen === 'signup'
                    ? 'Create account'
                    : screen === 'forgot'
                      ? 'Send reset email'
                      : screen === 'updatePassword'
                        ? 'Save new password'
                        : 'Log in'}
              </Text>
            </TouchableOpacity>

            {screen !== 'forgot' &&
              screen !== 'updatePassword' && (
                <TouchableOpacity
                  onPress={() =>
                    setScreen(
                      screen === 'signup'
                        ? 'login'
                        : 'signup'
                    )
                  }
                >
                  <Text style={styles.switchText}>
                    {screen === 'signup'
                      ? 'Already have an account? Log in'
                      : 'New to Folio? Create an account'}
                  </Text>
                </TouchableOpacity>
              )}

            {(screen === 'forgot' ||
              screen === 'updatePassword') && (
              <TouchableOpacity
                onPress={() => setScreen('login')}
              >
                <Text style={styles.switchText}>
                  ← Back to login
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {screen !== 'welcome' &&
          screen !== 'updatePassword' && (
            <TouchableOpacity
              onPress={() => setScreen('welcome')}
            >
              <Text style={styles.backText}>
                ← Back
              </Text>
            </TouchableOpacity>
          )}

        <Text style={styles.footer}>
          YOUR BOOKS. YOUR SPACE.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 26,
  },
  logo: {
    color: C.white,
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
  },
  tagline: {
    color: C.grey,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 45,
    fontSize: 14,
  },
  panel: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 22,
  },
  heading: {
    color: C.white,
    fontSize: 23,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    color: C.grey,
    lineHeight: 22,
    marginBottom: 26,
  },
  input: {
    backgroundColor: C.bg,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 13,
    padding: 15,
    color: C.white,
    marginBottom: 13,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: C.crimson,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryText: {
    color: C.white,
    fontWeight: '600',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  forgotText: {
    color: C.grey,
    fontSize: 13,
  },
  switchText: {
    color: C.white,
    textAlign: 'center',
    marginTop: 22,
    fontSize: 13,
  },
  backText: {
    color: C.grey,
    textAlign: 'center',
    marginTop: 22,
  },
  footer: {
    color: C.grey,
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 3,
    marginTop: 40,
  },
});
