import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { ChevronLeft, Send, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { io } from 'socket.io-client';
import { Theme } from '../theme';
import { ApiService } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_CONFIG } from '../config/api.config'; // We need BASE_URL without /api for socket

export const ChatScreen = () => {
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const [text, setText] = useState('');
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(null);
    const flatListRef = useRef();

    useEffect(() => {
        ApiService.getUser().then(u => {
            if (u) {
                setUser(u);
                const socketUrl = API_CONFIG.BASE_URL.replace('/api', '');
                const newSocket = io(socketUrl);
                setSocket(newSocket);

                newSocket.on(`chat_${u.id}`, (newMessage) => {
                    queryClient.setQueryData(['chatMessages'], (old) => {
                        const messages = old || [];
                        // Prevent duplicates
                        if (messages.find(m => m.id === newMessage.id)) return messages;
                        return [...messages, newMessage];
                    });
                });
            }
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['chatMessages'],
        queryFn: ApiService.getMyMessages,
        refetchInterval: socket ? false : 3000, // fallback if socket fails
    });

    const mutation = useMutation({
        mutationFn: ApiService.sendChatMessage,
        onSuccess: () => {
            setText('');
            queryClient.invalidateQueries(['chatMessages']);
        }
    });

    const handleSend = () => {
        if (!text.trim()) return;
        mutation.mutate(text);
    };

    const renderMessage = ({ item }) => {
        const isMe = item.sender === 'CUSTOMER';
        return (
            <View style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageOther]}>
                <Text style={[styles.messageText, isMe ? { color: 'white' } : { color: '#333' }]}>{item.text}</Text>
                <Text style={[styles.timeText, isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: Theme.colors.textSecondary }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={Theme.colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <View style={styles.avatar}>
                        <Text style={{ fontSize: 18 }}>🍰</Text>
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Suporte Puculuxa</Text>
                        <Text style={styles.headerSubtitle}>Online agora</Text>
                    </View>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                </View>
            ) : messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MessageCircle size={64} color={Theme.colors.textSecondary} style={{ opacity: 0.2, marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>Iniciar Conversa</Text>
                    <Text style={styles.emptyText}>Tens alguma dúvida sobre um bolo ou evento? Fala connosco!</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={i => i.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.chatList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    onLayout={() => flatListRef.current?.scrollToEnd()}
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Escreve uma mensagem..."
                    value={text}
                    onChangeText={setText}
                    multiline
                />
                <TouchableOpacity style={[styles.sendButton, !text.trim() && { opacity: 0.5 }]} onPress={handleSend} disabled={mutation.isPending || !text.trim()}>
                    {mutation.isPending ? <ActivityIndicator color="white" size="small" /> : <Send size={20} color="white" />}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: 'white', ...Theme.shadows?.light, zIndex: 10 },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEBF0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    headerSubtitle: { fontSize: 12, color: '#4CAF50', fontWeight: '500' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textSecondary, marginBottom: 8 },
    emptyText: { fontSize: 14, color: Theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    chatList: { padding: 16, paddingBottom: 32 },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
    messageMe: { alignSelf: 'flex-end', backgroundColor: Theme.colors.primary, borderBottomRightRadius: 4 },
    messageOther: { alignSelf: 'flex-start', backgroundColor: 'white', borderWidth: 1, borderColor: '#f0f0f0', borderBottomLeftRadius: 4 },
    messageText: { fontSize: 15, lineHeight: 20 },
    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, minHeight: 48, maxHeight: 120, fontSize: 15, marginRight: 12 },
    sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center' }
});
