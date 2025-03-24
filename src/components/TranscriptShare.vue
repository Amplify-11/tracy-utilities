<script setup lang="ts">
import { ref, computed, watch} from 'vue';
import type { Transcript } from '../types';
const props = defineProps<{
  transcript: Transcript;
}>();
const error = ref('');
const success = ref('');


interface ZapierResponse {
	attempt: string
	id: string
	request_id: string
	status: string
}

interface Action {
	title: string
	zapId: string
	data?: Record<string, unknown>
}

const userSettings = {
	email: 't@amplify11.com',
	zapierUserId: '8902810',
	emailZapId: '2e8v0gj',
	sheetZapId: '2ezysyr',
	sheets: [
		{
			title: 'Dealers Sheet',
			sheetId: '13ANCOE1r4vQnTt0LqPqqYuDjqtq1LzuNzfbcQ3kEdVI',
			worksheetId: '31283979'
		}
	]
}

// const userSettings = {
// 	email: 'jeff@jeffjassky.com',
// 	zapierUserId: '3611272',
// 	emailZapId: '2le1gd1',
// 	sheetZapId: '2le55iv',
// 	sheets: [
// 		{
// 			title: 'PW Sheet',
// 			sheetId: '1Npqu2taeaCP170cUuTQBZCXF4HY2OazYwsPuriAyQ1c'
// 		}
// 	]
// }

const email = ref(userSettings.email);

const actions = computed<Action[]>(() => {
	return [
		{
			zapId: userSettings.emailZapId,
			title: 'Email to self',
			data: {
				email: userSettings.email
			}
		},
		...userSettings.sheets.map(sheet => ({
			zapId: userSettings.sheetZapId,
			title: sheet.title,
			data: {
				sheet
			}
		}))
	]
})

async function callAction(action: Action){
	const results = await fetch(`https://hooks.zapier.com/hooks/catch/${userSettings.zapierUserId}/${action.zapId}`, {
		method: 'post',
		body: JSON.stringify({
			...props.transcript,
			...action.data
		})
	})
	const zapierResponse = await results.json() as ZapierResponse
	console.log({zapierResponse})
	if(zapierResponse.status === 'success'){
		success.value = 'Success'
	}else{
		error.value = 'Failed'
	}
}

watch(success, () =>{
	setTimeout(() => {
		success.value = ''
	}, 3000)
})

watch(error, () =>{
	setTimeout(() => {
		error.value = ''
	}, 3000)
})

</script>

<template>
  <div class="share-container">
    <h2>Share Transcript</h2>

    <div class="share-buttons">
      <button v-for="action in actions" @click="callAction(action)" class="share-button square">
        {{action.title}}
      </button>
    </div>

	<div class="input-group">
		<input v-model="email" type="email" placeholder="Enter email address" />
	</div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">{{ success }}</div>
  </div>
</template>

<style scoped>
.share-container {
  padding: 1rem;
}

.share-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
	margin-bottom: var(--spacing-base);
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

input, select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.share-button {
  padding: 0.5rem 1rem;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: inherit;
}

.share-button.square{
	aspect-ratio: 1;
	display: inline;
}

.share-button:hover {
  background: #0056b3;
}

.error {
  color: #ff3b30;
  margin-top: 1rem;
}

.success {
  color: #34c759;
  margin-top: 1rem;
}
</style>