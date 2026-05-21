import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const strings = {
  en: { title: "Patrol", active: "Active Patrols", join: "Join Patrol", start: "Start New Patrol", members: "Members", area: "Area", duration: "Duration" },
  af: { title: "Patrollie", active: "Aktiewe Patrollies", join: "Sluit Patrollie", start: "Begin Nuwe Patrollie", members: "Lede", area: "Gebied", duration: "Duur" },
};

const MOCK_PATROLS = [
  { id:'1', area:'Noordwyk', area_af:'Noordwyk', members:4, duration:'2 uur', active:true },
  { id:'2', area:'Southdowns', area_af:'Suidheuwels', members:2, duration:'1 uur', active:true },
];

export default function Patrol() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const t = strings[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{t.title}</Text>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#1e40af'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      <Text style={s.sectionTitle}>{t.active}</Text>
      {MOCK_PATROLS.map(p => (
        <View key={p.id} style={s.card}>
          <Text style={s.cardTitle}>{lang==='af' ? p.area_af : p.area}</Text>
          <Text style={s.cardSub}>{t.members}: {p.members} · {t.duration}: {p.duration}</Text>
          <TouchableOpacity style={s.joinBtn}><Text style={s.joinTxt}>{t.join}</Text></TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={s.startBtn}><Text style={s.startTxt}>{t.start}</Text></TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0f172a'}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:20,paddingTop:50},
  title:{fontSize:24,fontWeight:'bold',color:'#fff'}, langRow:{flexDirection:'row',alignItems:'center',gap:6}, langLabel:{color:'#94a3b8',fontSize:12},
  sectionTitle:{color:'#e2e8f0',fontSize:18,fontWeight:'600',marginHorizontal:20,marginTop:10,marginBottom:8},
  card:{backgroundColor:'#1e293b',margin:10,marginHorizontal:16,padding:16,borderRadius:10},
  cardTitle:{color:'#f1f5f9',fontSize:16,fontWeight:'600'}, cardSub:{color:'#64748b',fontSize:13,marginTop:4},
  joinBtn:{marginTop:10,padding:10,borderRadius:8,backgroundColor:'#1e40af',alignItems:'center'},
  joinTxt:{color:'#fff',fontWeight:'bold'}, startBtn:{margin:20,padding:16,borderRadius:10,backgroundColor:'#16a34a',alignItems:'center'},
  startTxt:{color:'#fff',fontWeight:'bold',fontSize:16},
});
