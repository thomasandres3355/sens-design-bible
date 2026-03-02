import { createContext, useContext, useState, useCallback, useMemo } from "react";

const SimDateContext = createContext(null);

const toDateStr = (d) => d.toISOString().split("T")[0];
const parseDate = (s) => new Date(s + "T12:00:00");

export const SimDateProvider = ({ children }) => {
  const realToday = new Date();
  const yesterday = new Date(realToday);
  yesterday.setDate(yesterday.getDate() - 1);
  const maxDate = toDateStr(yesterday);

  const [simDate, setSimDate] = useState(maxDate);
  const [historyDepth, setHistoryDepth] = useState("1y");

  const advanceDay = useCallback(() => {
    setSimDate((prev) => {
      const d = parseDate(prev);
      d.setDate(d.getDate() + 1);
      const next = toDateStr(d);
      return next > maxDate ? maxDate : next;
    });
  }, [maxDate]);

  const retreatDay = useCallback(() => {
    setSimDate((prev) => {
      const d = parseDate(prev);
      d.setDate(d.getDate() - 1);
      return toDateStr(d);
    });
  }, []);

  const jumpToDate = useCallback((dateStr) => {
    setSimDate(dateStr > maxDate ? maxDate : dateStr);
  }, [maxDate]);

  const historyStart = useMemo(() => {
    const d = parseDate(simDate);
    const map = { "30d": 30, "90d": 90, "1y": 365, "2y": 730 };
    d.setDate(d.getDate() - (map[historyDepth] || 365));
    return toDateStr(d);
  }, [simDate, historyDepth]);

  const value = useMemo(
    () => ({
      simDate,
      maxDate,
      historyDepth,
      historyStart,
      setHistoryDepth,
      advanceDay,
      retreatDay,
      jumpToDate,
      parseDate,
      toDateStr,
    }),
    [simDate, maxDate, historyDepth, historyStart, advanceDay, retreatDay, jumpToDate]
  );

  return (
    <SimDateContext.Provider value={value}>{children}</SimDateContext.Provider>
  );
};

export const useSimDate = () => {
  const ctx = useContext(SimDateContext);
  if (!ctx) throw new Error("useSimDate must be used within SimDateProvider");
  return ctx;
};
