import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { ChevronLeft, Send, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { io } from 'socket.io-client';
import { Theme, T } from '../theme';
import { ApiService } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_CONFIG } from '../config/api.config';

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
                        if (messages.find(m => m.id === newMessage.id)) return messages;
                        return [...messages, newMessage];
                    });
                });
            }
        });
        return () => { if (socket) socket.disconnect(); };
    }, []);

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['chatMessages'],
        queryFn: ApiService.getMyMessages,
        refetchInterval: socket ? false : 3000,
    });

    const mutation = useMutation({
        mutationFn: ApiService.sendChatMessage,
        onSuccess: () => { setText(''); queryClient.invalidateQueries(['chatMessages']); },
    });

    const handleSend = () => {
        if (!text.trim()) return;
        mutation.mutate(text);
    };

    const renderMessage = ({ item }) => {
        const isMe = item.sender === 'CUSTOMER';
        return (
            <View style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageOther]}>
                <Text style={[styles.messageText, { color: isMe ? Theme.colors.white : Theme.colors.textPrimary }]}>{item.text}</Text>
                <Text style={[styles.timeText, { color: isMe ? 'rgba(255,255,255,0.6)' : Theme.colors.textTertiary }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Voltar">
                    <ChevronLeft size={22} color={Theme.colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.avatar}>
                        <Text style={{ fontSize: 18 }}>🍰</Text>
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Suporte Puculuxa</Text>
                        <Text style={styles.headerOnline}>Online agora</Text>
                    </View>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                </View>
            ) : messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MessageCircle size={64} color={Theme.colors.borderStrong} style={{ marginBottom: 16 }} />
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
                    placeholderTextColor={Theme.colors.textTertiary}
                    value={text}
                    onChangeText={setText}
                    multiline
                    accessibilityLabel="Mensagem"
                />
                <TouchableOpacity style={[styles.sendButton, !text.trim() ? { opacity: 0.5 } : null]} onPress={handleSend} disabled={mutation.isPending || !text.trim()} accessibilityLabel="Enviar mensagem">
                    {mutation.isPending ? <ActivityIndicator color={Theme.colors.white} size="small" /> : <Send size={20} color={Theme.colors.white} />}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: Theme.colors.surfaceElevated, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerInfo: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.colors.primaryGhost, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: Theme.colors.textPrimary },
    headerOnline: { fontFamily: T.bodySmall.fontFamily, fontSize: 12, color: Theme.colors.success },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyTitle: { ...T.h3, marginBottom: 8 },
    emptyText: { ...T.body, color: Theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    chatList: { padding: 16, paddingBottom: 32 },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 10 },
    messageMe: { alignSelf: 'flex-end', backgroundColor: Theme.colors.primary, borderBottomRightRadius: 4 },
    messageOther: { alignSelf: 'flex-start', backgroundColor: Theme.colors.surfaceElevated, borderWidth: 1, borderColor: Theme.colors.border, borderBottomLeftRadius: 4 },
    messageText: { fontFamily: T.body.fontFamily, fontSize: 15, lineHeight: 20 },
    timeText: { fontFamily: T.bodySmall.fontFamily, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: Theme.colors.surfaceElevated, borderTopWidth: 1, borderTopColor: Theme.colors.border },
    input: { flex: 1, backgroundColor: Theme.colors.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, minHeight: 44, maxHeight: 100, fontFamily: T.body.fontFamily, fontSize: 15, color: Theme.colors.textPrimary, marginRight: 10, borderWidth: 1, borderColor: Theme.colors.border },
    sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
});
