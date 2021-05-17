**CalculateRatio**

Das CalculateRatio-Tool berechnet Relationen zwischen ausgewählten Datensätzen (statistischen Daten und Einrichtungsdaten) und stellt die Ergebnisse in Tabellenform dar. Die Ergebnisse können darüberhinaus nach Excel exportiert und mithilfe des ColorCodeMap Tools oder des ChartGenerators visualisiert werden.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Gebiet auswählen|Name des Werkzeuges im Menu.|
|glyphicon|nein|String|glyphicon-map|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|isVisibleInMenu|nein|Boolean|false|Das Tool wird nicht im Menü geladen.|

**Beispiel**
```
"CalculateRatio": {
  "name": "Versorgungsanalyse",
  "glyphicon": "glyphicon-tasks,
  "isVisibleInMenu", true
}
```

***