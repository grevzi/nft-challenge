import type {GetServerSideProps, NextPage} from 'next'
import Head from 'next/head'
import Link from 'next/link'
import {useAddress, useDisconnect, useMetamask} from "@thirdweb-dev/react";
import React from "react";
import {sanityClient, urlFor} from '../sanity'
import {Collection} from "../typings";

interface Props {
	collections: Collection[]
}

const Home = ({collections}: Props) => {
	const connectWithMetamask = useMetamask();
	const address = useAddress();
	const disconnect = useDisconnect();
	return (
		<div className="max-w-7xl mx-auto flex flex-col min-h-screen py-20 px-10 2xl:px-0">
			<Head>
				<title>NFT Drop Collections</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<header className="flex items-center justify-between">
				<p className="w-52 text-xl font-extralight md:w-[30rem] md:text-2xl lg:w-[40rem] lg:text-4xl">
					The <span className="font-extrabold underline decoration-pink-600/50">GREVZI</span> NFT
					Market
					Place
				</p>

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

			<main className="bg-slate-100 p-10 shadow-xl shadow-rose-400/20 mt-5 rounded-2xl">
				<div className="space-x-3 grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
					{collections.map(collection => (
						<Link key={collection._id} href={`/nft/${collection.slug.current}`}>
							<div
							 className="
							 flex flex-col items-center cursor-pointer transition-all duration-200
							 hover:scale-105
							 ">

							<img
								className="h-96 w-60 rounded-2xl object-cover"
								src={urlFor(collection.mainImage).url()}
								alt={collection.title}
							/>

							<div className="p-5">
								<h2 className="text-3xl">{collection.title}</h2>
								<p className="mt-2 text-sm text-gray-400">{collection.description}</p>
							</div>
						</div>
						</Link>
					))}
				</div>
			</main>

		</div>
	)
}

export default Home

export const getServerSideProps: GetServerSideProps = async () => {
	const query = `
		*[_type == "collection"]{
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

	const collections = await sanityClient.fetch(query)

	return {
		props: {
			collections
		}
	}
}