import React, {useEffect, useState} from 'react';
import {useAddress, useDisconnect, useMetamask, useNFTDrop} from "@thirdweb-dev/react";
import Head from "next/head";
import {GetServerSideProps} from "next";
import {sanityClient, urlFor} from "../../sanity";
import {Collection} from "../../typings";
import {toast, Toaster} from "react-hot-toast";
import {NFTDrop} from "@thirdweb-dev/sdk";
import Link from 'next/link'

interface Props {
	collection: Collection
}

const NFTDropPage = ({collection}: Props) => {
	const connectWithMetamask = useMetamask();
	const address = useAddress();
	const disconnect = useDisconnect();
	const nftDrop = useNFTDrop(collection.address);

	const [loading, setLoading] = useState(true);
	const [priceInEth, setPriceInEth] = useState('');
	const [claimedSupply, setClaimedSupply] = useState(0);
	const [totalSupply, setTotalSupply] = useState(0);

	const fetchNFTDropData = async (nftDrop: NFTDrop) => {
		const claimed = await nftDrop.getAllClaimed();
		const total = await nftDrop.getAllUnclaimed();

		setClaimedSupply(claimed.length)
		setTotalSupply(claimed.length + total.length)
		setLoading(false)
	}

	useEffect(() => {
		if (!nftDrop) return;

		fetchNFTDropData(nftDrop)
	}, [nftDrop])

	useEffect(() => {
		if (!nftDrop) return;

		const fetchPrice = async () => {
			const claimedConditions = await nftDrop.claimConditions.getAll()
			setPriceInEth(claimedConditions?.[0].currencyMetadata.displayValue)
		}
		fetchPrice()
	}, [nftDrop])

	const mintNft = () => {
		if (!nftDrop || !address) return;

		setLoading(true)

		const notification = toast.loading('Minting...', {
			style: {
				background: 'white',
				color: 'green',
				fontWeight: 'bolder',
				fontSize: '17px',
				padding: '20px'
			}
		})

		const quantity = 1;

		nftDrop
			.claimTo(address, quantity)
			.then(async (tx) => {
				const receipt = tx[0].receipt
				const claimedTokenId = tx[0].id
				const claimedNFT = await tx[0].data()

				console.log({receipt, claimedTokenId, claimedNFT})

				toast('HOORAY... You SuccessFully Minted!', {
					duration: 8000,
					style: {
						background: 'green',
						color: 'white',
						fontWeight: 'bolder',
						fontSize: '17px',
						padding: '20px'
					}
				})
				fetchNFTDropData(nftDrop)
			})
			.catch(error => {
				console.error(error)
				toast('WHOOPS... Something went wrong!', {
					duration: 8000,
					style: {
						background: 'red',
						color: 'white',
						fontWeight: 'bolder',
						fontSize: '17px',
						padding: '20px'
					}
				})
			})
			.finally(() => {
				setLoading(false)
				toast.dismiss(notification)
			})
	}

	return (
		<div>
			<Head>
				<title>NFT Drop Collections</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Toaster position={'bottom-right'} />

			<div className="flex h-screen flex-col lg:grid grid-cols-10">
				<div className="bg-gradient-to-br from-cyan-800 to-rose-500 lg:col-span-4">
					<div className="flex flex-col items-center justify-center py-2 lg:min-h-screen">
						<div className="bg-gradient-to-br from-yellow-400 to-purple-600 p-2 rounded-xl">
							<img
								className="w-44 rounded-xl object-cover lg:h-96 lg:w-72"
								src={urlFor(collection.previewImage).url()}
								alt="ape" />
						</div>
						<div className="p-5 text-center space-y-2">
							<h1 className="text-4xl font-bold text-white">{collection.nftCollectionName}</h1>
							<h2 className="text-xl text-gray-300">{collection.description}</h2>
						</div>
					</div>
				</div>

				<div className="flex flex-1 flex-col p-6 lg:p-12 lg:col-span-6">
					<header className="flex items-center justify-between">
						<Link href={`/`}>
							<p className="w-52 cursor-pointer text-xl font-extralight sm:w-80">
								The <span className="font-extrabold underline decoration-pink-600/50">GREVZI</span> NFT
								Market
								Place
							</p>
						</Link>

						<button
							onClick={address ? disconnect : connectWithMetamask}
							className="rounded-full bg-rose-400 px-4 py-2 text-xs font-bold text-white lg:px-5 lg:py-3 lg:text-base">
							{address ? 'Sign Out' : 'Sign In'}
						</button>
					</header>

					<hr className="my-2 border" />

					{address && (
						<p className="text-center text-sm text-rose-400">
							You're logged in with
							wallet {address.substring(0, 5)}...{address.substring(address.length - 5)}
						</p>
					)}

					<div
						className="mt-10 flex flex-1 flex-col items-center space-y-6 text-center lg:space-y-0 lg:justify-center">
						<img
							className="w-80 object-cover pb-10 lg:h-40"
							src={urlFor(collection.mainImage).url()} alt="main-image" />
						<h2 className="text-3xl font-bold lg:text-4xl lg:font-extrabold">
							{collection.title}
						</h2>
						<p className="p-2 text-xl text-green-500">
							{loading ? <span className="animate-pulse">Loading...</span> : (
								`${claimedSupply} / ${totalSupply?.toString()} NFT's claimed`
							)}
						</p>

						{loading && (
							<img
								className="w-60 h-60 object-cover"
								src="https://cdn.hackernoon.com/images/0*4Gzjgh9Y7Gu8KEtZ.gif"
								alt="loading" />
						)}
					</div>
					<button
						onClick={mintNft}
						disabled={loading || claimedSupply === totalSupply || !address}
						className="mt-10 h-16 w-full bg-red-600 text-white rounded-full font-bold disabled:bg-gray-300">
						{loading
							? 'Loading'
							: claimedSupply === totalSupply
								? 'Sold Out'
								: !address
									? 'Sign In to Mint'
									: <span className="font-bold">Mint NFT ({priceInEth} ETH)</span>}
					</button>
				</div>
			</div>

		</div>
	)
};

export default NFTDropPage;

export const getServerSideProps: GetServerSideProps = async ({params}) => {
	const query = `*[_type == "collection" && slug.current == $id][0]{
		  _id,
		  title,
		  address,
		  description,
		  nftCollectionName,
		  mainImage {
			asset
		  },
		  previewImage {
			asset
		  },
		  slug {
			current
		  },
		  creator -> {
			_id,
			name,
			address,
			slug {
			  current
			}
		  }
		}
	`

	const collection = await sanityClient.fetch(query, {
		id: params?.id
	})

	if (!collection) {
		return {
			notFound: true
		}
	}

	return {
		props: {
			collection
		}
	}
}