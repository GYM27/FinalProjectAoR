export const formatTimeByMode = (index, startTime, isLive) => {
    // If not live, format as relative duration (MM:SS)
    if (!isLive) {
        if (index === undefined || index === null) return "00:00";
        const totalSeconds = Math.max(0, Math.floor(index));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // If live, calculate the actual local time based on the start time
    if (!startTime) return "00:00:00";

    let baseTimeMs;
    // Spring Boot JSON dates are usually an array [year, month, day, hour, minute, second, nano]
    if (Array.isArray(startTime)) {
        const [year, month, day, hour, minute, second, nano] = startTime;
        // Note: Java Month is 1-12, JS Month is 0-11
        baseTimeMs = new Date(year, month - 1, day, hour, minute, second, (nano || 0) / 1000000).getTime();
    } else {
        baseTimeMs = new Date(startTime).getTime();
    }

    // Apply the offset (seconds since start)
    const targetDate = new Date(baseTimeMs + ((index || 0) * 1000));
    
    return targetDate.toLocaleTimeString('pt-PT', { hour12: false });
};
