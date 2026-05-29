import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const strings = {
  en: { title: "Alerts", all: "All", high: "High", medium: "Medium", low: "Low", noAlerts: "No alerts in this category", resolve: "Resolve", details: "Details" },
  af: { title: "Waarskuwings", all: "Alles", high: "Hoog", medium: "Medium", low: "Laag", noAlerts: "Geen waarskuwings in hierdie kategorie", resolve: "Opgelos", details: "Besonderhede" },
};

const MOCK = [
  { id:'1', type:'high', title:'Suspicious vehicle', title_af:'Verdagte voertuig', time:'10 min ago', area:'Block 3' },
  { id:'2', type:'medium', title:'Noise complaint', title_af:'Geraasklagte', time:'1 hr ago', area:'Block 7' },
];

export default function Alerts() {
  const [lang, setLang] = useState<'en'|'af'>('af');
  const [filter, setFilter] = useState('all');
  const t = strings[lang];

  useEffect(() => { AsyncStorage.getItem('lang').then(v => v && setLang(v as any)); }, []);
  const toggleLang = (v: boolean) => { const l = v ? 'af' : 'en'; setLang(l); AsyncStorage.setItem('lang', l); };

  const filtered = filter === 'all' ? MOCK : MOCK.filter(a => a.type === filter);
  const colorMap: any = { high:'#dc2626', medium:'#d97706', low:'#16a34a' };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{t.title}</Text>
        <View style={s.langRow}><Text style={s.langLabel}>EN</Text><Switch value={lang==='af'} onValueChange={toggleLang} trackColor={{true:'#1e40af'}}/><Text style={s.langLabel}>AF</Text></View>
      </View>
      <View style={s.filters}>
        {['all','high','medium','low'].map(f => (
          <TouchableOpacity key={f} style={[s.chip, filter===f && s.chipActive]} onPress={()=>setFilter(f)}>
            <Text style={[s.chipText, filter===f && s.chipTextActive]}>{(t as any)[f]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={filtered} keyExtractor={i=>i.id} ListEmptyComponent={<Text style={s.empty}>{t.noAlerts}</Text>}
        renderItem={({item})=>(
          <View style={[s.card, {borderLeftColor: colorMap[item.type]}]}>
            <Text style={s.cardTitle}>{lang==='af' ? item.title_af : item.title}</Text>
            <Text style={s.cardSub}>{item.area} · {item.time}</Text>
            <TouchableOpacity style={[s.resolveBtn, {backgroundColor: colorMap[item.type]}]}><Text style={s.resolveTxt}>{t.resolve}</Text></TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0f172a'}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:20,paddingTop:50},
  title:{fontSize:24,fontWeight:'bold',color:'#fff'}, langRow:{flexDirection:'row',alignItems:'center',gap:6}, langLabel:{color:'#94a3b8',fontSize:12},
  filters:{flexDirection:'row',paddingHorizontal:16,gap:8,marginBottom:12},
  chip:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,backgroundColor:'#1e293b'},
  chipActive:{backgroundColor:'#1e40af'}, chipText:{color:'#94a3b8',fontSize:13}, chipTextActive:{color:'#fff'},
  card:{backgroundColor:'#1e293b',margin:10,marginHorizontal:16,padding:16,borderRadius:10,borderLeftWidth:4},
  cardTitle:{color:'#f1f5f9',fontSize:16,fontWeight:'600'}, cardSub:{color:'#64748b',fontSize:13,marginTop:4},
  resolveBtn:{marginTop:10,padding:8,borderRadius:8,alignItems:'center'}, resolveTxt:{color:'#fff',fontWeight:'bold'},
  empty:{color:'#64748b',textAlign:'center',marginTop:40},
});
