<script lang="ts">
	import { confetti } from '@neoconfetti/svelte';
	import { tweened } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { FFmpeg } from '@ffmpeg/ffmpeg';
	import { onMount } from 'svelte';
	import { readFile, downloadVideo } from '$lib/utils';

	type State = 'loading' | 'loaded' | 'convert.start' | 'convert.error' | 'convert.done';

	let state: State = 'loading';
	let error = '';
	let ffmpeg: FFmpeg;
	let progress = tweened(0);

	const convertFile = async (video: File) => {
		state = 'convert.start';

		try {
			const videoData = await readFile(video);

			await ffmpeg.writeFile('input.webm', videoData);
			await ffmpeg.exec(['-i', 'input.webm', 'output.mp4']);
			const data = await ffmpeg.readFile('output.mp4');

			state = 'convert.done';

			return data as Uint8Array;
		} catch (e) {
			error = e as string;
			state = 'convert.error';
		}
	};

	const handleDrop = async (event: DragEvent) => {
		if (!event.dataTransfer?.files) return;

		if (event.dataTransfer.files.length > 1) {
			error = 'Upload one file';
		}

		if (event.dataTransfer.files[0].type === 'video/webm') {
			error = '';
			const [file] = event.dataTransfer.files;
			const data = await convertFile(file);
			if (data) {
				downloadVideo(data);
			}
		} else {
			error = 'Only webm is supported';
		}
	};

	const loadFfmpeg = async () => {
		const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

		ffmpeg = new FFmpeg();

		ffmpeg.on('progress', (event) => {
			$progress = event.progress * 100;
		});

		await ffmpeg.load({
			coreURL: `${baseURL}/ffmpeg-core.js`,
			wasmURL: `${baseURL}/ffmpeg-core.wasm`
		});

		state = 'loaded';
	};

	onMount(() => {
		loadFfmpeg();
	});
</script>

<main class="container mx-auto flex h-full flex-col items-center justify-center">
	<h1 class="mb-8 text-5xl font-bold">WebM To MP4 Converter</h1>

	<div
		class="flex h-96 w-[70%] flex-col items-center justify-center gap-6 rounded-xl border-8 border-dashed border-zinc-700"
	>
		{#if state === 'loading'}
			<p in:fade class="text-3xl font-bold text-zinc-700">Loading FFmpeg</p>
		{/if}

		{#if state === 'loaded'}
			<div
				role="button"
				tabindex="0"
				on:drop|preventDefault={handleDrop}
				on:dragover|preventDefault={() => {}}
				class="flex h-full w-full items-center justify-center outline-none"
			>
				<p in:fade class="text-3xl font-bold text-zinc-700">Drag video here</p>
			</div>
		{/if}

		{#if state === 'convert.start'}
			<p in:fade class="text-3xl font-bold text-zinc-700">Converting...</p>
			<div class="h-10 w-80 rounded border-2 border-zinc-700">
				<div
					style="width: {$progress}%;"
					class="flex h-full items-center justify-center bg-zinc-100"
				>
					<span class="font-bold text-zinc-950">{$progress.toFixed(0)}%</span>
				</div>
			</div>
		{/if}

		{#if state === 'convert.done'}
			<div use:confetti />
			<p in:fade class="text-3xl font-bold text-green-700">Conversion done!</p>
		{/if}

		{#if error}
			<p in:fade class="text-3xl font-bold text-red-700">Error: {error}</p>
		{/if}
	</div>
</main>
