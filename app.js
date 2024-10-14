document.getElementById('reviewForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const charity = document.getElementById('charity').value.trim();
    const rating = parseInt(document.getElementById('rating').value.trim(), 10);
    const review = document.getElementById('review').value.trim();

    if (rating < 1 || rating > 5) {
        alert("Rating must be between 1 and 5.");
        return;
    }

    const newReview = {
        name: name,
        charity: charity,
        rating: rating,
        review: review
    };

    const reviewData = JSON.stringify(newReview);
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                pinata_api_key: '73b730a856c604322d86',
                pinata_secret_api_key: '5ebcd76d17d82fa14053248bae2cf34ba1f1e8211ce996400350bdcddb2795f6'
            },
            body: reviewData
        });

        if (!response.ok) {
            throw new Error(`Failed to upload to Pinata: ${response.statusText}`);
        }

        const data = await response.json();
        const ipfsHash = data.IpfsHash;

        const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
        reviews.push({ ipfsHash, ...newReview });
        localStorage.setItem('reviews', JSON.stringify(reviews));

        document.getElementById('reviewForm').reset();
        displayReviews();
        document.getElementById('reviewToggleBtn').style.display = 'block';

    } catch (error) {
        console.error("Error uploading to Pinata:", error);
        alert("Failed to submit review. Please try again.");
    }
});

async function displayReviews() {
    const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    const reviewList = document.getElementById('reviewList');
    reviewList.innerHTML = '';

    for (const review of reviews) {
        let ipfsReview = review;

        try {
            if (review.ipfsHash) {
                const response = await fetch(`https://gateway.pinata.cloud/ipfs/${review.ipfsHash}`);
                if (response.ok) {
                    ipfsReview = await response.json();
                } else {
                    console.error("Failed to fetch from IPFS:", response.statusText);
                }
            }
        } catch (error) {
            console.error("Error fetching from IPFS:", error);
        }

        const reviewCard = document.createElement('div');
        reviewCard.classList.add('review-card', 'mb-3', 'shadow-sm');
        reviewCard.innerHTML = `
            <h4>${ipfsReview.name} reviewed ${ipfsReview.charity}</h4>
            <p><strong>Rating: ${'⭐'.repeat(ipfsReview.rating)}</strong></p>
            <p>"${ipfsReview.review}"</p>
            <p><strong>IPFS Hash:</strong> ${review.ipfsHash}</p>
            <button class="delete-btn" data-index="${reviews.indexOf(review)}">Delete</button>
        `;
        reviewList.appendChild(reviewCard);
    }

    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function () {
            const index = this.getAttribute('data-index');
            deleteReview(index);
        });
    });
}

document.getElementById('reviewToggleBtn').addEventListener('click', function () {
    const reviewSection = document.getElementById('reviewSection');
    reviewSection.style.display = reviewSection.style.display === 'none' ? 'block' : 'none';

    if (reviewSection.style.display === 'none') {
        document.getElementById('reviewList').innerHTML = '';
    } else {
        displayReviews();
    }
});

function deleteReview(index) {
    const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    reviews.splice(index, 1);
    localStorage.setItem('reviews', JSON.stringify(reviews));
    displayReviews();
}

displayReviews();


