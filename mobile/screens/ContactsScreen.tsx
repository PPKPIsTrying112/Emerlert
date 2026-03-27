import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { supabase } from '../lib/supabase';

type Contact = {
  id: number;
  name: string;
  phone: string;
};

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', 'demo_user')
      .order('id', { ascending: true });

    if (error) console.error('Fetch error:', error);
    else setContacts(data || []);
    setLoading(false);
  };

const addContact = async () => {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow access to contacts.');
    return;
  }

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
  });

  // Filter only contacts that have phone numbers
  const withPhones = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);

  if (withPhones.length === 0) {
    Alert.alert('No contacts with phone numbers found');
    return;
  }

  // Show first 10 as alert options (simple approach)
  const options = withPhones.slice(0, 10).map(c => ({
    text: c.name || 'Unknown',
   onPress: async () => {
  console.log('Contact selected:', c.name);
  const phone = c.phoneNumbers![0].number!;
  console.log('Phone:', phone);
  
  console.log('About to call Supabase...');  // ADD THIS
  
  try {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({ user_id: 'demo_user', name: c.name, phone })
      .select();

    console.log('Supabase result:', JSON.stringify(data));
    console.log('Supabase error:', JSON.stringify(error));

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Saved!', `${c.name} added`);
      fetchContacts();
    }
  } catch (err) {
    console.log('CAUGHT ERROR:', JSON.stringify(err));  // ADD THIS
    Alert.alert('Caught error', String(err));
  }
}
  }));

  options.push({ text: 'Cancel', onPress: () => {} });

  Alert.alert('Pick a contact', 'Select who to add', options);
};

  const deleteContact = async (id: number) => {
    Alert.alert('Remove contact', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await supabase.from('emergency_contacts').delete().eq('id', id);
          fetchContacts();
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.subtitle}>These people will be alerted when you press SOS</Text>

      {loading ? (
        <ActivityIndicator color="#ef4444" style={{ marginTop: 40 }} />
      ) : contacts.length === 0 ? (
        <Text style={styles.empty}>No contacts added yet</Text>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.contactRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactPhone}>{item.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteContact(item.id)}>
                <Text style={styles.deleteBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.addBtn} onPress={addContact}>
        <Text style={styles.addBtnText}>+ Add Contact</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 30 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 16 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#ef4444', justifyContent: 'center',
    alignItems: 'center', marginRight: 12
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  contactName: { fontSize: 16, fontWeight: '600', color: '#111' },
  contactPhone: { fontSize: 13, color: '#888', marginTop: 2 },
  deleteBtn: { fontSize: 18, color: '#ccc', padding: 4 },
  addBtn: {
    backgroundColor: '#ef4444', borderRadius: 14,
    padding: 18, alignItems: 'center', marginTop: 20
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});