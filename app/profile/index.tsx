import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const strings = {
  en: { title: "Profile", plan: "Plan", upgrade: "Upgrade Plan", alerts_sent: "Alerts Sent", patrols: "Patrols Joined", reports: "Reports Filed", logout: "Log Out", individual: "Individual", family: "Family Bundle", suite: "Die Afrikaanse Suite™" },
  af: { title: "Profiel", plan: "Plan", upgrade: "Opgradeer Plan", alerts_sent: "Waarskuwings Gestuur", patrols: "Patrollies Gesluit", reports: "Verslae Ingedien", logout: "Teken Uit", individual: "Individueel", family: "Familie Bundel", suite: "Die Afrikaanse Suite™" },
};

export default function Profile() {
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
      <View style={s.planCard}>
        <Text style={s.planLabel}>{t.plan}</Text>
        <Text style={s.planName}>{t.suite}</Text>
        <Text style={s.planPrice}>R149/mo</Text>
        <TouchableOpacity style={s.upgradeBtn}><Text style={s.upgradeTxt}>{t.upgrade}</Text></TouchableOpacity>
      </View>
      <View style={s.statsRow}>
        <View style={s.stat}><Text style={s.statNum}>12</Text><Text style={s.statLabel}>{t.alerts_sent}</Text></View>
        <View style={s.stat}><Text style={s.statNum}>5</Text><Text style={s.statLabel}>{t.patrols}</Text></View>
        <View style={s.stat}><Text style={s.statNum}>3</Text><Text style={s.statLabel}>{t.reports}</Text></View>
      </View>
      <TouchableOpacity style={s.logoutBtn}><Text style={s.logoutTxt}>{t.logout}</Text></TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0f172a'}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:20,paddingTop:50},
  title:{fontSize:24,fontWeight:'bold',color:'#fff'}, langRow:{flexDirection:'row',alignItems:'center',gap:6}, langLabel:{color:'#94a3b8',fontSize:12},
  planCard:{margin:20,padding:20,backgroundColor:'#1e293b',borderRadius:12,alignItems:'center'},
  planLabel:{color:'#94a3b8',fontSize:13}, planName:{color:'#fff',fontSize:18,fontWeight:'bold',marginTop:4},
  planPrice:{color:'#60a5fa',fontSize:22,fontWeight:'bold',marginTop:4},
  upgradeBtn:{marginTop:12,paddingHorizontal:24,paddingVertical:10,backgroundColor:'#1e40af',borderRadius:8},
  upgradeTxt:{color:'#fff',fontWeight:'bold'},
  statsRow:{flexDirection:'row',justifyContent:'space-around',marginHorizontal:20,marginBottom:20},
  stat:{alignItems:'center',backgroundColor:'#1e293b',padding:16,borderRadius:10,flex:1,marginHorizontal:4},
  statNum:{color:'#fff',fontSize:24,fontWeight:'bold'}, statLabel:{color:'#94a3b8',fontSize:11,textAlign:'center',marginTop:4},
  logoutBtn:{margin:20,padding:16,borderRadius:10,backgroundColor:'#dc2626',alignItems:'center'},
  logoutTxt:{color:'#fff',fontWeight:'bold',fontSize:16},
});
