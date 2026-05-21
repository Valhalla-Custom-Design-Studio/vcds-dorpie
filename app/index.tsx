import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const strings = {
  en: { title: "Dorpwag™", subtitle: "Community Safety Network", alerts: "Active Alerts", noAlerts: "No active alerts", report: "Report Incident", patrol: "Join Patrol", safe: "Mark Area Safe", status: "Area Status", safe_label: "SAFE", watch_label: "WATCH", danger_label: "DANGER" },
  af: { title: "Dorpwag™", subtitle: "Gemeenskapsveiligheidsnetwerk", alerts: "Aktiewe Waarskuwings", noAlerts: "Geen aktiewe waarskuwings", report: "Rapporteer Voorval", patrol: "Sluit Patrollie", safe: "Merk Gebied Veilig", status: "Gebied Status", safe_label: "VEILIG", watch_label: "WAAK", danger_label: "GEVAAR" },
};

export default function DorpwagHome() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [alerts] = useState([]);
  const t = strings[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <View><Text style={s.title}>{t.title}</Text><Text style={s.subtitle}>{t.subtitle}</Text></View>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#1e40af'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      <View style={s.statusBadge}><Text style={s.statusText}>{t.safe_label}</Text></View>
      <Text style={s.sectionTitle}>{t.alerts}</Text>
      {alerts.length === 0 && <Text style={s.empty}>{t.noAlerts}</Text>}
      <TouchableOpacity style={[s.btn, {backgroundColor:'#dc2626'}]}><Text style={s.btnText}>{t.report}</Text></TouchableOpacity>
      <TouchableOpacity style={[s.btn, {backgroundColor:'#1e40af'}]}><Text style={s.btnText}>{t.patrol}</Text></TouchableOpacity>
      <TouchableOpacity style={[s.btn, {backgroundColor:'#16a34a'}]}><Text style={s.btnText}>{t.safe}</Text></TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0f172a'}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:20,paddingTop:50},
  title:{fontSize:28,fontWeight:'bold',color:'#fff'}, subtitle:{fontSize:13,color:'#94a3b8'},
  langRow:{flexDirection:'row',alignItems:'center',gap:6}, langLabel:{color:'#94a3b8',fontSize:12},
  statusBadge:{margin:20,padding:16,backgroundColor:'#16a34a',borderRadius:12,alignItems:'center'},
  statusText:{color:'#fff',fontSize:20,fontWeight:'bold'}, sectionTitle:{color:'#e2e8f0',fontSize:18,fontWeight:'600',marginHorizontal:20,marginTop:10},
  empty:{color:'#64748b',marginHorizontal:20,marginTop:8}, btn:{margin:12,marginHorizontal:20,padding:16,borderRadius:10,alignItems:'center'},
  btnText:{color:'#fff',fontWeight:'bold',fontSize:16},
});
