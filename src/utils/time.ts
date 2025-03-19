export function msToTimestamp(totalMilliseconds: number){
	const totalSeconds = Math.floor(totalMilliseconds / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const milliseconds = Math.floor((totalMilliseconds % 1000) / 10); // Convert to two-digit format
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
  }

  export function secondsToTimestamp(totalSeconds: number){
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.round(totalSeconds % 60);
	return `${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}`;
  }