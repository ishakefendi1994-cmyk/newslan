jQuery(document).ready(function ($) {
    console.log('[Newslan AI] Admin JS v1.0.3 Loaded');
    console.log('[Newslan AI] AJAX URL:', newslanData.ajax_url);

    // ==========================================================================
    // MANUAL TOOLS: Preset Selector fills URL field
    // ==========================================================================
    $(document).on('change', '#newslan_manual_preset', function () {
        var url = $(this).val();
        if (url) {
            $('#newslan_manual_rss_url').val(url);
        }
    });

    // Show/hide thumbnail style row based on image mode
    function toggleThumbnailStyleRow() {
        if ($('#newslan_research_image_mode').val() === 'generate_ai') {
            $('#row-thumbnail-style').show();
        } else {
            $('#row-thumbnail-style').hide();
        }
    }

    // Run on page load (in case browser remembered the select value)
    toggleThumbnailStyleRow();

    // Run on change
    $(document).on('change', '#newslan_research_image_mode', function () {
        toggleThumbnailStyleRow();
    });

    // ==========================================================================
    // MANUAL TOOLS: Fetch RSS Now
    // ==========================================================================
    $(document).on('click', '#newslan-manual-fetch', function (e) {
        e.preventDefault();
        var $btn = $(this);
        var $status = $('#newslan-fetch-status');
        var rssUrl = $('#newslan_manual_rss_url').val().trim();

        $btn.prop('disabled', true).text('⏳ Memproses...');
        $status.html('<span style="color:#d64e07;">⏳ Sedang mengambil dan memproses berita...</span>');
        console.log('[Newslan AI] Manual Fetch started. URL:', rssUrl);

        $.post(newslanData.ajax_url, {
            action: 'newslan_manual_fetch',
            nonce: newslanData.nonce,
            rss_url: rssUrl
        }, function (response) {
            console.log('[Newslan AI] Fetch Response:', response);
            $btn.prop('disabled', false).text('▶ Fetch & Proses Sekarang');
            if (response.success) {
                $status.html('<span style="color:green;">✅ ' + response.data + '</span>');
            } else {
                $status.html('<span style="color:#d63638;">❌ ' + response.data + '</span>');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Newslan AI] Fetch FAIL - Status:', xhr.status, 'Text:', xhr.responseText);
            $btn.prop('disabled', false).text('▶ Fetch & Proses Sekarang');
            $status.html('<span style="color:#d63638;">❌ HTTP Error ' + xhr.status + ' — ' + error + '</span>');
        });
    });

    // ==========================================================================
    // MANUAL TOOLS: Quick Research
    // ==========================================================================
    $(document).on('click', '#newslan-start-research', function () {
        var $btn = $(this);
        var $status = $('#newslan-research-status');
        var keyword = $('#newslan_research_keyword').val().trim();
        var style = $('#newslan_research_style').val() || 'Professional';
        var model = $('#newslan_research_model').val() || 'Straight News';
        var imgMode = $('#newslan_research_image_mode').val() || 'rss';
        var thumbStyle = $('#newslan_research_thumbnail_style').val() || 'editorial_vector';

        if (!keyword) {
            alert('Masukkan kata kunci terlebih dahulu.');
            return;
        }

        $btn.prop('disabled', true).text('⏳ Sedang riset...');

        var waitMsg = imgMode === 'generate_ai'
            ? '⏳ Mengambil berita + Generate gambar AI via Replicate... (bisa 60–90 detik)'
            : '⏳ Mengambil berita dari Google News dan memproses AI... (bisa 30–60 detik)';
        $status.html('<span style="color:#d64e07;">' + waitMsg + '</span>');
        console.log('[Newslan AI] Research:', keyword, '| Style:', style, '| Model:', model, '| Image:', imgMode, '| Thumb:', thumbStyle);


        $.post(newslanData.ajax_url, {
            action: 'newslan_research_keyword',
            nonce: newslanData.nonce,
            keyword: keyword,
            writing_style: style,
            article_model: model,
            image_mode: imgMode,
            thumbnail_style: thumbStyle
        }, function (response) {
            console.log('[Newslan AI] Research Response:', response);
            $btn.prop('disabled', false).text('🔬 Mulai Riset & Posting');
            if (response.success) {
                $status.html('<span style="color:green;">✅ ' + response.data + '</span>');
                $('#newslan_research_keyword').val('');
            } else {
                $status.html('<span style="color:#d63638;">❌ ' + response.data + '</span>');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Newslan AI] Research FAIL - Status:', xhr.status, 'Text:', xhr.responseText.substring(0, 500));
            $btn.prop('disabled', false).text('🔬 Mulai Riset & Posting');
            $status.html('<span style="color:#d63638;">❌ HTTP Error ' + xhr.status + ' — Cek tab Network di DevTools untuk detail.</span>');
        });
    });

    // ==========================================================================
    // SETTINGS: Test API
    // ==========================================================================
    $(document).on('click', '#newslan-test-api', function () {
        var $btn = $(this);
        var $status = $('#test-api-status');

        $btn.prop('disabled', true).text('⏳ Testing...');
        $status.html('<span style="color:#666;">Menghubungi Groq...</span>');
        console.log('[Newslan AI] Testing API connection...');

        $.post(newslanData.ajax_url, {
            action: 'newslan_test_api',
            nonce: newslanData.nonce
        }, function (response) {
            console.log('[Newslan AI] API Test Response:', response);
            $btn.prop('disabled', false).text('🧪 Test Koneksi');
            if (response.success) {
                $status.html('<span style="color:green;">✅ ' + response.data + '</span>');
            } else {
                $status.html('<span style="color:#d63638;">❌ ' + response.data + '</span>');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Newslan AI] API Test FAIL - Status:', xhr.status, 'Resp:', xhr.responseText.substring(0, 500));
            $btn.prop('disabled', false).text('🧪 Test Koneksi');
            $status.html('<span style="color:#d63638;">❌ HTTP ' + xhr.status + ' — ' + error + '</span>');
        });
    });

    // ==========================================================================
    // AUTO-JOBS: Open / Close form
    // ==========================================================================
    $(document).on('click', '#newslan-open-job-form', function () {
        $('#newslan-job-form-container').slideDown();
        $(this).hide();
    });

    $(document).on('click', '#newslan-close-job-form', function () {
        $('#newslan-job-form-container').slideUp();
        $('#newslan-open-job-form').show();
    });
    // Toggle keyword/rss/idea rows based on job type
    $(document).on('change', '#job_type', function () {
        var type = $(this).val();
        $('#row-keyword, #row-rss, #row-ai-idea').hide();

        if (type === 'rss_watcher') {
            $('#row-rss').show();
        } else if (type === 'ai_editor') {
            $('#row-ai-idea').show();
        } else {
            $('#row-keyword').show();
        }
    });

    // Toggle job thumbnail style row
    $(document).on('change', '#job_image_mode', function () {
        if ($(this).val() === 'generate_ai') {
            $('#row-job-thumbnail-style').show();
        } else {
            $('#row-job-thumbnail-style').hide();
        }
    });

    // AUTO-JOBS: Save
    $(document).on('click', '#newslan-save-job', function () {
        var $btn = $(this);
        var jobName = $('#job_name').val().trim();

        if (!jobName) {
            alert('Nama Job wajib diisi!');
            return;
        }

        $btn.prop('disabled', true).text('⏳ Menyimpan...');
        console.log('[Newslan AI] Saving job:', jobName);

        $.post(newslanData.ajax_url, {
            action: 'newslan_save_job',
            nonce: newslanData.nonce,
            job_name: jobName,
            job_type: $('#job_type').val(),
            keyword: $('#job_keyword').val(),
            rss_url: $('#job_rss_url').val(),
            ai_idea: $('#job_ai_idea').val(),
            category: $('#job_category').val(),
            article_model: $('#job_article_model').val(),
            image_mode: $('#job_image_mode').val(),
            thumbnail_style: $('#job_thumbnail_style').val(),
            max_articles: $('#job_max_articles').val(),
            writing_style: $('#job_writing_style').val(),
            publish_status: 'publish'
        }, function (response) {
            console.log('[Newslan AI] Save Job Response:', response);
            if (response.success) {
                alert('✅ ' + response.data);
                location.reload();
            } else {
                alert('❌ ' + response.data);
                $btn.prop('disabled', false).text('💾 Simpan Job');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Newslan AI] Save Job FAIL:', xhr.status, error);
            alert('❌ HTTP Error ' + xhr.status);
            $btn.prop('disabled', false).text('💾 Simpan Job');
        });
    });

    // AUTO-JOBS: Run
    $(document).on('click', '.run-job', function () {
        var $btn = $(this);
        var jobId = $btn.data('id');
        var orig = $btn.text();

        $btn.prop('disabled', true).text('⏳ Running...');
        console.log('[Newslan AI] Running job ID:', jobId);

        $.post(newslanData.ajax_url, {
            action: 'newslan_run_job',
            nonce: newslanData.nonce,
            job_id: jobId
        }, function (response) {
            console.log('[Newslan AI] Run Job Response:', response);
            $btn.prop('disabled', false).text(orig);
            if (response.success) {
                alert('✅ ' + response.data);
            } else {
                alert('❌ ' + response.data);
            }
        }).fail(function (xhr, status, error) {
            console.error('[Newslan AI] Run Job FAIL:', xhr.status, xhr.responseText.substring(0, 500));
            $btn.prop('disabled', false).text(orig);
            alert('❌ HTTP Error ' + xhr.status + '. Cek Server Error Log untuk detail.');
        });
    });

    // AUTO-JOBS: Delete
    $(document).on('click', '.delete-job', function () {
        if (!confirm('Yakin hapus job ini?')) return;

        var $btn = $(this);
        var jobId = $btn.data('id');

        $.post(newslanData.ajax_url, {
            action: 'newslan_delete_job',
            nonce: newslanData.nonce,
            job_id: jobId
        }, function (response) {
            if (response.success) {
                $btn.closest('tr').fadeOut(400, function () { $(this).remove(); });
            } else {
                alert('❌ ' + response.data);
            }
        }).fail(function (xhr) {
            alert('❌ HTTP Error ' + xhr.status);
        });
    });
});
